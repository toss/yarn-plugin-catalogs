import {
  type Descriptor,
  type Project,
  type Workspace,
  structUtils,
} from "@yarnpkg/core";
import { configReader } from "./config";
import { CATALOG_PROTOCOL } from "../constants";
import type { ValidationLevel } from "../types";
import { getDefaultAliasGroups } from "./default";
import { getInheritanceChain } from "./functions";

export interface ValidationResult {
  shouldIgnore: boolean;
  catalogProtocolViolations: Array<{
    descriptor: Descriptor;
    validationLevel: Omit<ValidationLevel, "off">;
    applicableGroups: string[];
  }>;
  ignoredWorkspaceWithCatalogProtocol: boolean;
}

/**
 * Validate workspace for catalog usage
 * Returns all validation issues without reporting them
 */
export async function validateWorkspace(
  workspace: Workspace,
): Promise<ValidationResult> {
  const shouldIgnore = await configReader.shouldIgnoreWorkspace(workspace);

  // Check if ignored workspace uses catalog protocol
  const hasCatalogProtocol = [
    ...Object.values<string>(workspace.manifest.raw.dependencies || {}),
    ...Object.values<string>(workspace.manifest.raw.devDependencies || {}),
  ].some((version) => version.startsWith(CATALOG_PROTOCOL));

  const ignoredWorkspaceWithCatalogProtocol =
    shouldIgnore && hasCatalogProtocol;

  // Check catalog protocol violations
  let catalogProtocolViolations: ValidationResult["catalogProtocolViolations"] =
    [];

  if (!shouldIgnore) {
    catalogProtocolViolations =
      await validateWorkspaceCatalogUsability(workspace);
  }

  return {
    shouldIgnore,
    catalogProtocolViolations,
    ignoredWorkspaceWithCatalogProtocol,
  };
}

/**
 * Check if a package can be used with the catalog protocol
 */
export async function validateCatalogUsability(
  workspace: Workspace,
  descriptor: Descriptor,
): Promise<{
  validationLevel: "warn" | "strict" | "off";
  applicableGroups: string[];
} | null> {
  // Skip if already using catalog protocol
  if (descriptor.range.startsWith(CATALOG_PROTOCOL)) {
    return null;
  }

  // Skip if workspace is ignored
  if (await configReader.shouldIgnoreWorkspace(workspace)) {
    return null;
  }

  const defaultAliasGroups = await getDefaultAliasGroups(workspace);

  // Find all groups that can access this package
  const packageName = structUtils.stringifyIdent(descriptor);
  const groupsWithDependency = await findAllGroupsWithSpecificDependency(
    workspace.project,
    packageName,
  );
  const accessibleGroups = groupsWithDependency.flatMap(({ groupName }) =>
    defaultAliasGroups.length === 0 || defaultAliasGroups.includes(groupName)
      ? [groupName]
      : [],
  );

  if (accessibleGroups.length === 0) {
    return null;
  }

  // Get validation level for the package
  const validationLevel = await getPackageVaidationLevel(
    workspace,
    packageName,
  );

  return {
    validationLevel,
    applicableGroups: accessibleGroups,
  };
}

export async function validateWorkspaceCatalogUsability(
  workspace: Workspace,
): Promise<
  Array<{
    descriptor: Descriptor;
    validationLevel: Omit<ValidationLevel, "off">;
    applicableGroups: string[];
  }>
> {
  const dependencyDescriptors = [
    ...Object.entries<string>(workspace.manifest.raw.dependencies ?? {}),
    ...Object.entries<string>(workspace.manifest.raw.devDependencies ?? {}),
  ].map(([stringifiedIdent, version]) => {
    const ident = structUtils.parseIdent(stringifiedIdent);
    return structUtils.makeDescriptor(ident, version);
  });

  const results = [];

  for (const descriptor of dependencyDescriptors) {
    const validationInfo = await validateCatalogUsability(
      workspace,
      descriptor,
    );

    // Only include packages that have validation enabled (not 'off')
    if (validationInfo && validationInfo.validationLevel !== "off") {
      results.push({
        descriptor,
        validationLevel: validationInfo.validationLevel,
        applicableGroups: validationInfo.applicableGroups,
      });
    }
  }

  return results;
}

/**
 * Get validation level for a specific group (considering inheritance)
 */
async function getGroupValidationLevel(
  workspace: Workspace,
  groupName: string,
): Promise<ValidationLevel> {
  const config = await configReader.readConfiguration(workspace.project);
  const validationConfig = config.options?.validation || "warn";

  if (typeof validationConfig === "string") {
    return validationConfig;
  }

  // Search inheritance chain for explicit validation setting
  const inheritanceChain = getInheritanceChain(groupName);

  for (let i = inheritanceChain.length - 1; i >= 0; i--) {
    const currentGroup = inheritanceChain[i];
    if (validationConfig[currentGroup] !== undefined) {
      return validationConfig[currentGroup];
    }
  }

  return "warn"; // Default fallback
}

/**
 * Get the strictest validation level for a package across all accessible groups
 */
async function getPackageVaidationLevel(
  workspace: Workspace,
  packageName: string,
): Promise<ValidationLevel> {
  const accessibleGroups = (
    await findAllGroupsWithSpecificDependency(workspace.project, packageName)
  ).map(({ groupName }) => groupName);

  if (accessibleGroups.length === 0) {
    return "off";
  }

  const validationLevels: ValidationLevel[] = [];
  for (const groupName of accessibleGroups) {
    const level = await getGroupValidationLevel(workspace, groupName);
    validationLevels.push(level);
  }

  // Return the strictest level (strict > warn > off)
  if (validationLevels.includes("strict")) return "strict";
  if (validationLevels.includes("warn")) return "warn";
  return "off";
}

/**
 * Find all groups that contain a specific dependency
 * Note: Catalogs from .yarnrc.yml already have inheritance resolved
 */
async function findAllGroupsWithSpecificDependency(
  project: Project,
  packageName: string,
): Promise<Array<{ groupName: string; version: string }>> {
  const config = await configReader.readConfiguration(project);
  const results: Array<{ groupName: string; version: string }> = [];

  if (!config.catalogs) {
    return results;
  }

  for (const [groupName, group] of Object.entries(config.catalogs)) {
    const version = group[packageName];
    if (version) {
      results.push({ groupName, version });
    }
  }

  return results;
}
