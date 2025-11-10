import { type Descriptor, structUtils, type Project } from "@yarnpkg/core";
import {
  CatalogConfigurationError,
  type CatalogsConfiguration,
  configReader,
} from "../configuration";
import { ROOT_ALIAS_GROUP } from "../constants";
import { getInheritanceChain } from "./functions";

/**
 * Get a specific version from the configuration
 */
export async function resolveCatalogDependency(
  project: Project,
  aliasGroup: string,
  packageName: string,
): Promise<string> {
  const config = await configReader.readConfiguration(project);

  const aliasGroupToFind =
    aliasGroup.length === 0 ? ROOT_ALIAS_GROUP : aliasGroup;

  // Try to resolve through inheritance chain first
  const inheritedVersion = resolveInheritedRange(
    config,
    aliasGroupToFind,
    packageName,
  );

  if (inheritedVersion) {
    // If version doesn't have a protocol prefix (e.g., "npm:"), add "npm:" as default
    if (!/^[^:]+:/.test(inheritedVersion)) {
      return `${project.configuration.get(
        "defaultProtocol",
      )}${inheritedVersion}`;
    }
    return inheritedVersion;
  }

  // Fallback to direct lookup for backward compatibility
  const aliasConfig = config.list?.[aliasGroupToFind];

  if (!aliasConfig || typeof aliasConfig === "string") {
    throw new CatalogConfigurationError(
      `Alias "${aliasGroupToFind}" not found in .yarnrc.yml catalogs.`,
      CatalogConfigurationError.INVALID_ALIAS,
    );
  }

  const version = aliasConfig[packageName];
  if (!version) {
    throw new CatalogConfigurationError(
      `Package "${packageName}" not found in alias "${aliasGroupToFind}"`,
      CatalogConfigurationError.INVALID_ALIAS,
    );
  }

  // If version doesn't have a protocol prefix (e.g., "npm:"), add "npm:" as default
  if (!/^[^:]+:/.test(version)) {
    return `${project.configuration.get("defaultProtocol")}${version}`;
  }

  return version;
}

/**
 * Find a specific dependency in the configuration
 * and return the names of alias groups it belongs to, along with its versions.
 * This method now includes inherited groups in the results.
 */
export async function findAllGroupsWithSpecificDependency(
  project: Project,
  packageName: string,
): Promise<Array<{ groupName: string; version: string }>> {
  const config = await configReader.readConfiguration(project);
  const results: Array<{ groupName: string; version: string }> = [];

  // Use resolveInheritedRange for all groups to handle both direct and inherited matches
  for (const groupName of Object.keys(config.list || {})) {
    const resolvedVersion = resolveInheritedRange(
      config,
      groupName,
      packageName,
    );

    if (resolvedVersion) {
      results.push({ groupName, version: resolvedVersion });
    }
  }

  return results;
}

/**
 * Resolve package version through inheritance chain
 */
function resolveInheritedRange(
  config: CatalogsConfiguration,
  groupName: string,
  packageName: string,
): string | null {
  const chain = getInheritanceChain(groupName);

  // Search from most specific to least specific
  for (let i = chain.length - 1; i >= 0; i--) {
    const currentGroup = chain[i];
    const aliasConfig = config.list?.[currentGroup];

    if (aliasConfig && typeof aliasConfig === "object") {
      const version = aliasConfig[packageName];
      if (version) {
        return version;
      }
    }
  }

  // Check root-level packages (packages that are direct string values)
  if (config.list && typeof config.list === "object") {
    const rootValue = config.list[packageName];
    if (typeof rootValue === "string") {
      return rootValue;
    }
  }

  // Check ROOT_ALIAS_GROUP if it exists
  const rootAliasConfig = config.list?.[ROOT_ALIAS_GROUP];
  if (rootAliasConfig && typeof rootAliasConfig === "object") {
    const version = rootAliasConfig[packageName];
    if (version) {
      return version;
    }
  }

  return null;
}
