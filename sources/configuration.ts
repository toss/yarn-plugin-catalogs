import { Descriptor, Project } from "@yarnpkg/core";

export const DEFAULT_ALIAS_GROUP = "YARN__PLUGIN__CATALOG__DEFAULT__GROUP";

export const CATALOG_PROTOCOL = "catalog:";

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs: CatalogsConfiguration;
  }
}

/**
 * Configuration structure for .yarnrc.yml#catalogs
 */
export interface CatalogsConfiguration {
  [alias: string]:
    | {
        [packageName: string]: string;
      }
    | string;
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
    const rawConfig = project.configuration.get("catalogs") as unknown;

    // Transform config to handle root-level string values
    const config = Object.entries(rawConfig as Record<string, object>).reduce(
      (acc, [key, value]) => {
        if (typeof value === "string") {
          // If value is a string, put it under DEFAULT_ALIAS_GROUP
          acc[DEFAULT_ALIAS_GROUP] = {
            ...(acc[DEFAULT_ALIAS_GROUP] || {}),
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
        "Invalid catalogs configuration format. Expected structure: { [alias: string]: { [packageName: string]: string } }",
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
      aliasGroup.length === 0 ? DEFAULT_ALIAS_GROUP : aliasGroup;

    const aliasConfig = config[aliasGroupToFind];

    if (!aliasConfig) {
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
   * Find a specific dependency in the configuration
   * and return the names of alias groups it belongs to, along with its versions.
   */
  async findDependency(
    project: Project,
    dependency: Descriptor,
  ): Promise<[string, string][] | null> {
    const config = await this.readConfiguration(project);
    
    const aliasGroups = Object.entries(config).filter(([_, value]) => {
      if (typeof value === "string") {
        return dependency.name === value;
      } else {
        return Object.keys(value).includes(dependency.name);
      }
    });

    if (aliasGroups.length === 0) return null;

    return aliasGroups.map(([alias, aliasConfig]) => {
      const version = typeof aliasConfig === "string" ? aliasConfig : aliasConfig[dependency.name];
      return [alias, version];
    });
  }

  /**
   * Clear the configuration cache for a specific workspace
   */
  clearCache(workspaceRoot: string): void {
    this.configCache.delete(workspaceRoot);
  }

  private isValidConfiguration(
    config: unknown
  ): config is CatalogsConfiguration {
    if (!config || typeof config !== "object") {
      return false;
    }

    for (const [_, aliasConfig] of Object.entries(config)) {
      if (!aliasConfig || typeof aliasConfig !== "object") {
        return false;
      }

      for (const version of Object.values(aliasConfig)) {
        if (typeof version !== "string") {
          return false;
        }
      }
    }

    return true;
  }
}
