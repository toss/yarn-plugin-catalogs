import {
  type Descriptor,
  type Project,
  structUtils,
  type Workspace,
} from "@yarnpkg/core";
import { xfs, ppath } from "@yarnpkg/fslib";
import { parseSyml } from "@yarnpkg/parsers";
import { isMatch } from "picomatch";

export const ROOT_ALIAS_GROUP = "root";

export const CATALOG_PROTOCOL = "catalog:";

type ValidationLevel = "warn" | "strict" | "off";
type ValidationConfig =
  | ValidationLevel
  | { [groupName: string]: ValidationLevel };

/**
 * Extended configuration for catalog options (plugin-specific)
 * This configuration is stored in catalogs.yml
 */
export interface CatalogsOptions {
  /**
   * The default alias group to be used when no group is specified when adding a dependency
   * - if list of alias groups, it will be used in order
   * - if 'max', the most frequently used alias group will be used
   */
  default?: string[] | "max";
  /**
   * List of workspaces to ignore
   */
  ignoredWorkspaces?: string[];
  /**
   * Validation level for catalog usage
   * - 'warn': Show warnings when catalog versions are not used (default)
   * - 'strict': Throw errors when catalog versions are not used
   * - 'off': Disable validation
   * Can also be an object with group-specific settings: { [groupName]: 'warn' | 'strict' | 'off' }
   */
  validation?: ValidationConfig;
}

/**
 * Internal combined configuration structure
 */
export interface CatalogsConfiguration {
  options?: CatalogsOptions;

  /** Normalized catalog groups from Yarn's native catalog/catalogs configuration */
  catalogs?: {
    [alias: string]:
      | {
          [packageName: string]: string;
        }
      | string;
  };
}

/**
 * Handles reading and parsing of Yarn's native catalog configuration
 * and plugin-specific `catalogsOptions`
 */
export class CatalogConfigurationReader {
  private configCache: Map<string, CatalogsConfiguration> = new Map();

  /**
   * Read and parse the catalog configuration from Yarn's native `catalog` and `catalogs`
   * and combine with plugin-specific options from catalogs.yml
   */
  async readConfiguration(project: Project): Promise<CatalogsConfiguration> {
    const workspaceRoot = project.cwd;
    const cacheKey = workspaceRoot;

    const cached = this.configCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const catalog = project.configuration.get("catalog");
    const catalogs = project.configuration.get("catalogs");

    // Read options from catalogs.yml
    const catalogsYmlPath = ppath.join(project.cwd, "catalogs.yml");
    let options: CatalogsOptions = {};

    try {
      if (await xfs.existsPromise(catalogsYmlPath)) {
        const content = await xfs.readFilePromise(catalogsYmlPath, "utf8");
        const parsed = parseSyml(content);
        options = parsed?.options || {};
      }
    } catch {
      // If catalogs.yml doesn't exist or is invalid, use empty options
    }

    // Combine into internal structure
    const config: CatalogsConfiguration = {
      options,
      catalogs: {},
    };

    // Add root catalog if it exists
    if (catalog instanceof Map && catalog.size > 0) {
      if (config.catalogs) {
        config.catalogs[ROOT_ALIAS_GROUP] = Object.fromEntries(catalog);
      }
    }

    // Add named catalogs
    if (catalogs instanceof Map && catalogs.size > 0) {
      for (const [catalogName, catalogContent] of catalogs.entries()) {
        if (catalogContent instanceof Map && config.catalogs) {
          config.catalogs[catalogName] = Object.fromEntries(catalogContent);
        }
      }
    }

    // Cache the configuration
    this.configCache.set(cacheKey, config);

    return config;
  }

  /**
   * Get a specific version from the configuration
   * Note: This is primarily used for validation and finding packages
   * Actual resolution is handled by Yarn's native catalog support
   */
  async getRange(
    project: Project,
    aliasGroup: string,
    packageName: string,
  ): Promise<string | null> {
    const config = await this.readConfiguration(project);

    const aliasGroupToFind =
      aliasGroup.length === 0 ? ROOT_ALIAS_GROUP : aliasGroup;

    // Direct lookup in the specified group
    const aliasConfig = config.catalogs?.[aliasGroupToFind];
    if (aliasConfig && typeof aliasConfig === "object") {
      const version = aliasConfig[packageName];
      if (version) {
        return version;
      }
    }

    return null;
  }

  /**
   * Get the default alias group from the configuration if it exists
   */
  async getDefaultAliasGroups(workspace: Workspace): Promise<string[]> {
    const config = await this.readConfiguration(workspace.project);

    if (config.options) {
      // There's no default alias group if the workspace should be ignored
      if (await this.shouldIgnoreWorkspace(workspace)) {
        return [];
      }

      if (config.options.default) {
        // If default value is an list of alias groups, return it
        if (Array.isArray(config.options.default)) {
          return config.options.default;
        }

        // If default value is "max", find the most frequently used alias group
        if (config.options.default === "max") {
          const aliasGroups = Object.keys(config.catalogs || {});

          const dependencies = [
            ...workspace.manifest.dependencies,
            ...workspace.manifest.devDependencies,
          ];
          const counts: Record<string, number> = Object.fromEntries(
            aliasGroups.map((aliasGroup) => [aliasGroup, 0]),
          );

          // Count the occurrences of each alias group in the dependencies
          for (const [_, descriptor] of dependencies) {
            if (descriptor.range.startsWith(CATALOG_PROTOCOL)) {
              const aliasGroup = descriptor.range.substring(
                CATALOG_PROTOCOL.length,
              );
              counts[aliasGroup] = (counts[aliasGroup] || 0) + 1;
            }
          }

          // Find the alias group with the maximum count of dependencies
          const maxCount = Math.max(...Object.values(counts));
          return Object.keys(counts).filter(
            (aliasGroup) => counts[aliasGroup] === maxCount,
          );
        }
      }
    }

    return [];
  }

  /**
   * Find all groups that can access a specific package
   */
  async findAllAccessibleGroups(
    project: Project,
    packageName: string,
  ): Promise<string[]> {
    const config = await this.readConfiguration(project);
    const accessibleGroups: string[] = [];

    for (const [groupName, groupContent] of Object.entries(
      config.catalogs || {},
    )) {
      if (typeof groupContent === "object" && groupContent[packageName]) {
        accessibleGroups.push(groupName);
      }
    }

    return accessibleGroups;
  }

  /**
   * Get validation level for a specific group
   */
  async getGroupValidationLevel(
    workspace: Workspace,
    groupName: string,
  ): Promise<ValidationLevel> {
    const config = await this.readConfiguration(workspace.project);
    const validationConfig = config.options?.validation || "warn";

    if (typeof validationConfig === "string") {
      return validationConfig;
    }

    // Check for group-specific validation setting
    if (validationConfig[groupName] !== undefined) {
      return validationConfig[groupName];
    }

    return "warn"; // Default fallback
  }

  /**
   * Get the strictest validation level for a package across all accessible groups
   */
  async getValidationLevelForPackage(
    workspace: Workspace,
    packageName: string,
  ): Promise<ValidationLevel> {
    const accessibleGroups = await this.findAllAccessibleGroups(
      workspace.project,
      packageName,
    );

    if (accessibleGroups.length === 0) {
      return "off";
    }

    const validationLevels: ValidationLevel[] = [];
    for (const groupName of accessibleGroups) {
      const level = await this.getGroupValidationLevel(workspace, groupName);
      validationLevels.push(level);
    }

    // Return the strictest level (strict > warn > off)
    if (validationLevels.includes("strict")) return "strict";
    if (validationLevels.includes("warn")) return "warn";
    return "off";
  }

  /**
   * Find a specific dependency in the configuration
   * and return the names of alias groups it belongs to, along with its versions.
   */
  async findDependency(
    project: Project,
    dependency: Descriptor,
  ): Promise<[string, string][]> {
    const dependencyString = structUtils.stringifyIdent(dependency);
    const config = await this.readConfiguration(project);
    const results: [string, string][] = [];

    // Direct lookup in all groups
    for (const [groupName, groupContent] of Object.entries(
      config.catalogs || {},
    )) {
      if (typeof groupContent === "object") {
        const version = groupContent[dependencyString];
        if (version) {
          results.push([groupName, version]);
        }
      }
    }

    return results;
  }

  /**
   * Clear the configuration cache for a specific workspace
   */
  clearCache(workspaceRoot: string): void {
    this.configCache.delete(workspaceRoot);
  }

  /**
   * Check if a workspace is ignored based on the configuration
   */
  async shouldIgnoreWorkspace(workspace: Workspace): Promise<boolean> {
    if (!workspace.manifest.name) return false;

    const config = await this.readConfiguration(workspace.project);

    if (config.options?.ignoredWorkspaces) {
      return isMatch(
        structUtils.stringifyIdent(workspace.manifest.name),
        config.options.ignoredWorkspaces,
      );
    }

    return false;
  }

  async getValidationLevel(workspace: Workspace): Promise<ValidationLevel> {
    const config = await this.readConfiguration(workspace.project);

    if (config.options?.validation) {
      if (typeof config.options.validation === "string") {
        return config.options.validation;
      }
    }

    return "warn";
  }
}
