import { Descriptor, Project, structUtils, Workspace } from "@yarnpkg/core";
import { isMatch } from "picomatch";

export const ROOT_ALIAS_GROUP = "root";

export const CATALOG_PROTOCOL = "catalog:";

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs?: CatalogsConfiguration;
  }
}

type ValidationLevel = "warn" | "strict";

/**
 * Configuration structure for .yarnrc.yml#catalogs
 */
export interface CatalogsConfiguration {
  options?: {
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
     */
    validation?: ValidationLevel;
  };
  list?: {
    [alias: string]:
      | {
          [packageName: string]: string;
        }
      | string;
  };
}

/**
 * Error thrown when .yarnrc.yml#catalogs is invalid or missing
 */
export class CatalogConfigurationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "CatalogConfigurationError";
  }

  static FILE_NOT_FOUND = "FILE_NOT_FOUND";
  static INVALID_FORMAT = "INVALID_FORMAT";
  static INVALID_ALIAS = "INVALID_ALIAS";
}

/**
 * Handles reading and parsing of .yarnrc.yml#catalogs configuration
 */
export class CatalogConfigurationReader {
  private configCache: Map<string, CatalogsConfiguration> = new Map();

  /**
   * Read and parse the .yarnrc.yml#catalogs file
   */
  async readConfiguration(project: Project): Promise<CatalogsConfiguration> {
    const workspaceRoot = project.cwd;
    const cacheKey = workspaceRoot;

    // Check cache first
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get config from project configuration
    const rawConfig = (project.configuration.get("catalogs") || {}) as Record<
      string,
      object
    >;

    let config = rawConfig;
    // Transform config to handle root-level string values
    config["list"] = Object.entries(rawConfig["list"]).reduce(
      (acc, [key, value]) => {
        if (typeof value === "string") {
          // If value is a string, put it under BASE_ALIAS_GROUP
          acc[ROOT_ALIAS_GROUP] = {
            ...(acc[ROOT_ALIAS_GROUP] || {}),
            [key]: value,
          };
        } else {
          // Otherwise keep the original structure
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, object>
    );

    // Validate configuration structure
    if (!this.isValidConfiguration(config)) {
      throw new CatalogConfigurationError(
        "Invalid catalogs configuration format. Expected structure: { options?: { default?: string[] | 'max', ignoredWorkspaces?: string[], validation?: 'warn' | 'strict' }, list: { [alias: string]: { [packageName: string]: string } } }",
        CatalogConfigurationError.INVALID_FORMAT
      );
    }

    // Cache the configuration
    this.configCache.set(cacheKey, config);

    return config;
  }

  /**
   * Get a specific version from the configuration
   */
  async getRange(
    project: Project,
    aliasGroup: string,
    packageName: string
  ): Promise<string> {
    const config = await this.readConfiguration(project);

    const aliasGroupToFind =
      aliasGroup.length === 0 ? ROOT_ALIAS_GROUP : aliasGroup;

    const aliasConfig = config.list?.[aliasGroupToFind];

    if (!aliasConfig || typeof aliasConfig === "string") {
      throw new CatalogConfigurationError(
        `Alias "${aliasGroupToFind}" not found in .yarnrc.yml catalogs.`,
        CatalogConfigurationError.INVALID_ALIAS
      );
    }

    const version = aliasConfig[packageName];
    if (!version) {
      throw new CatalogConfigurationError(
        `Package "${packageName}" not found in alias "${aliasGroupToFind}"`,
        CatalogConfigurationError.INVALID_ALIAS
      );
    }

    // If version doesn't have a protocol prefix (e.g., "npm:"), add "npm:" as default
    if (!/^[^:]+:/.test(version)) {
      return `${project.configuration.get("defaultProtocol")}${version}`;
    }

    return version;
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
          const aliasGroups = Object.keys(config.list || {});

          const dependencies = [
            ...workspace.manifest.dependencies,
            ...workspace.manifest.devDependencies,
          ];
          const counts: Record<string, number> = Object.fromEntries(
            aliasGroups.map((aliasGroup) => [aliasGroup, 0])
          );

          // Count the occurrences of each alias group in the dependencies
          for (const [_, descriptor] of dependencies) {
            if (descriptor.range.startsWith(CATALOG_PROTOCOL)) {
              const aliasGroup = descriptor.range.substring(
                CATALOG_PROTOCOL.length
              );
              counts[aliasGroup] = (counts[aliasGroup] || 0) + 1;
            }
          }

          // Find the alias group with the maximum count of dependencies
          const maxCount = Math.max(...Object.values(counts));
          return Object.keys(counts).filter(
            (aliasGroup) => counts[aliasGroup] === maxCount
          );
        }
      }
    }

    return [];
  }

  /**
   * Find a specific dependency in the configuration
   * and return the names of alias groups it belongs to, along with its versions.
   */
  async findDependency(
    project: Project,
    dependency: Descriptor
  ): Promise<[string, string][]> {
    const dependencyString = structUtils.stringifyIdent(dependency);

    const config = await this.readConfiguration(project);

    const aliasGroups = Object.entries(config.list || {}).filter(
      ([_, value]) => {
        if (typeof value === "string") {
          return dependencyString === value;
        } else {
          return Object.keys(value).includes(dependencyString);
        }
      }
    );

    if (aliasGroups.length === 0) return [];

    return aliasGroups.map(([alias, aliasConfig]) => {
      const version =
        typeof aliasConfig === "string"
          ? aliasConfig
          : aliasConfig[dependencyString];
      return [alias, version];
    });
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
        config.options.ignoredWorkspaces
      );
    }

    return false;
  }

  async getValidationLevel(workspace: Workspace): Promise<ValidationLevel> {
    const config = await this.readConfiguration(workspace.project);

    if (config.options?.validation) {
      return config.options.validation;
    }

    return "warn";
  }

  private isValidConfiguration(
    config: unknown
  ): config is CatalogsConfiguration {
    if (!config || typeof config !== "object") {
      return false;
    }

    // The list property must be an object
    if (
      !("list" in config) ||
      !config["list"] ||
      typeof config["list"] !== "object"
    ) {
      return false;
    }

    for (const [_, aliasConfig] of Object.entries(config["list"])) {
      if (!aliasConfig || typeof aliasConfig !== "object") {
        return false;
      }

      for (const version of Object.values(aliasConfig)) {
        if (typeof version !== "string") {
          return false;
        }
      }
    }

    // Check the default option if it exists
    if (
      "options" in config &&
      config["options"] &&
      typeof config["options"] === "object"
    ) {
      if (
        "ignoredWorkspaces" in config["options"] &&
        config["options"]["ignoredWorkspaces"]
      ) {
        if (!Array.isArray(config["options"]["ignoredWorkspaces"])) {
          return false;
        }

        if (config["options"]["ignoredWorkspaces"].length === 0) {
          return false;
        }
      }

      if ("default" in config["options"] && config["options"]["default"]) {
        if (Array.isArray(config["options"]["default"])) {
          if (config["options"]["default"].length === 0) {
            return false;
          }

          const aliasGroups = Object.keys(config["list"]);
          for (const group of config["options"]["default"]) {
            if (group !== "root" && !aliasGroups.includes(group)) {
              return false;
            }
          }
        } else {
          if (typeof config["options"]["default"] !== "string") {
            return false;
          }

          if (config["options"]["default"] !== "max") {
            return false;
          }
        }
      }

      if ("validation" in config["options"]) {
        if (typeof config["options"]["validation"] !== "string") {
          return false;
        }

        if (!["warn", "strict"].includes(config["options"]["validation"])) {
          return false;
        }
      }
    }

    return true;
  }
}
