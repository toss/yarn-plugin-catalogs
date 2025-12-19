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
import { getDefaultAliasGroups } from "./default";

export interface ValidationViolation {
  descriptor: Descriptor;
  message: string;
  severity: "error" | "warning";
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

  const workspaceName = workspace.manifest.raw.name;

  for (const rule of catalogsYml.validation) {
    const matching = rule.workspaces.some((pattern) => isMatch(workspaceName, pattern));

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
    case "strict": {
      // MUST use catalog: protocol if package is in default catalog tracks
      if (isUsingCatalogProtocol) {
        return null;
      }

      const defaultGroups = await getDefaultAliasGroups(workspace);
      const catalogs = await configReader.getAppliedCatalogs(workspace.project);

      const existsInDefaultCatalog = defaultGroups.some((groupName) => packageName in catalogs[groupName]);

      if (existsInDefaultCatalog) {
        return {
          descriptor,
          message: `${packageName} is listed in the catalogs config, but not using catalog protocol.`,
          severity: "error",
        };
      }
      break;
    }

    case "warn": {
      // SHOULD use catalog: protocol. Warn if not in default catalog tracks.
      if (isUsingCatalogProtocol) {
        return null;
      }

      // Get default catalog tracks for this workspace
      const defaultGroups = await getDefaultAliasGroups(workspace);
      if (defaultGroups.length === 0) {
        // No default tracks configured, skip validation
        return null;
      }

      // Check if package exists in any of the default catalog tracks
      const catalogs = await configReader.getAppliedCatalogs(workspace.project);
      const existsInDefaultCatalog =
        catalogs &&
        defaultGroups.some(
          (groupName) => catalogs[groupName]?.[packageName] !== undefined,
        );

      if (existsInDefaultCatalog) {
        return {
          descriptor,
          message: `${packageName} is listed in the catalogs config, but not using catalog protocol.`,
          severity: "warning",
        };
      }
      break;
    }

    case "restrict":
      // MUST NOT use catalog: protocol
      if (isUsingCatalogProtocol) {
        return {
          descriptor,
          message: `${packageName} is using catalog protocol but this is restricted in this workspace.`,
          severity: "error",
        };
      }
      break;

    case "optional":
      // CAN use catalog: protocol. No warning even if not.
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
