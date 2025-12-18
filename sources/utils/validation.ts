import {
  type Descriptor,
  type Workspace,
  structUtils,
} from "@yarnpkg/core";
import { isMatch } from "picomatch";
import { CATALOG_PROTOCOL } from "../constants";
import { configReader } from "../configuration";
import type {
  ValidationRules,
  CatalogProtocolUsageRule,
} from "../configuration/types";

export interface ValidationViolation {
  descriptor: Descriptor;
  rule: keyof ValidationRules;
  ruleValue: string;
  message: string;
}

/**
 * Get the workspace's relative path for matching against glob patterns
 */
function getWorkspaceRelativePath(workspace: Workspace): string {
  return workspace.relativeCwd || ".";
}

/**
 * Find the first matching validation rule for a workspace
 * Returns null if no rule matches (validation is off)
 */
export async function findMatchingValidationRule(
  workspace: Workspace,
): Promise<ValidationRules | null> {
  const catalogsYml = await configReader.read(workspace.project);

  if (!catalogsYml?.validation || catalogsYml.validation.length === 0) {
    return null;
  }

  const workspacePath = getWorkspaceRelativePath(workspace);

  for (const rule of catalogsYml.validation) {
    const matching = rule.workspaces.some((pattern) => isMatch(workspacePath, pattern));

    if (matching) {
      return rule.rules;
    }
  }

  return null;
}

/**
 * Validate catalog protocol usage for a single dependency
 */
async function validateCatalogProtocolUsage(
  workspace: Workspace,
  descriptor: Descriptor,
  ruleValue: CatalogProtocolUsageRule,
): Promise<ValidationViolation | null> {
  const isUsingCatalogProtocol = descriptor.range.startsWith(CATALOG_PROTOCOL);
  const packageName = structUtils.stringifyIdent(descriptor);

  switch (ruleValue) {
    case "always": {
      // Must use catalog: protocol if package is in catalogs
      if (isUsingCatalogProtocol) {
        return null;
      }

      // Check if package exists in any catalog
      const catalogs = await configReader.getAppliedCatalogs(workspace.project);
      const existsInCatalog =
        catalogs &&
        Object.values(catalogs).some(
          (catalog) => catalog[packageName] !== undefined,
        );

      if (existsInCatalog) {
        return {
          descriptor,
          rule: "catalog_protocol_usage",
          ruleValue,
          message: `Package "${packageName}" is available in catalogs but not using catalog: protocol`,
        };
      }
      break;
    }

    case "restrict":
      // Must NOT use catalog: protocol
      if (isUsingCatalogProtocol) {
        return {
          descriptor,
          rule: "catalog_protocol_usage",
          ruleValue,
          message: `Package "${packageName}" is using catalog: protocol but this is restricted in this workspace`,
        };
      }
      break;

    case "optional":
      // No validation
      break;
  }

  return null;
}

/**
 * Validate all dependencies in a workspace against the matching rules
 */
export async function validateWorkspaceDependencies(
  workspace: Workspace,
): Promise<ValidationViolation[]> {
  const rules = await findMatchingValidationRule(workspace);

  // No matching rule = validation off for this workspace
  if (!rules) {
    return [];
  }

  const violations: ValidationViolation[] = [];

  // Collect all dependencies
  const dependencyDescriptors = [
    ...Object.entries<string>(workspace.manifest.raw.dependencies ?? {}),
    ...Object.entries<string>(workspace.manifest.raw.devDependencies ?? {}),
  ].map(([stringifiedIdent, version]) => {
    const ident = structUtils.parseIdent(stringifiedIdent);
    return structUtils.makeDescriptor(ident, version);
  });

  // Validate each dependency against active rules
  for (const descriptor of dependencyDescriptors) {
    // Validate catalog_protocol_usage rule if defined
    if (rules.catalog_protocol_usage) {
      const violation = await validateCatalogProtocolUsage(
        workspace,
        descriptor,
        rules.catalog_protocol_usage,
      );
      if (violation) {
        violations.push(violation);
      }
    }
  }

  return violations;
}
