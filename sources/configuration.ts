import { load as yamlLoad } from "js-yaml";
import { Project } from "@yarnpkg/core";
import { promises as fs } from "fs";
import { join } from "path";

const DEFAULT_ALIAS_GROUP = "YARN__PLUGIN__CATALOG__DEFAULT__GROUP";

/**
 * Configuration structure for catalog.yml
 */
export interface CatalogConfiguration {
  [alias: string]: {
    [packageName: string]: string;
  };
}

/**
 * Error thrown when catalog.yml is invalid or missing
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
 * Handles reading and parsing of catalog.yml configuration
 */
export class CatalogConfigurationReader {
  private configCache: Map<string, CatalogConfiguration> = new Map();

  /**
   * Read and parse the catalog.yml file
   */
  async readConfiguration(project: Project): Promise<CatalogConfiguration> {
    const workspaceRoot = project.cwd;
    const cacheKey = workspaceRoot;

    // Check cache first
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const configPath = join(workspaceRoot, "catalog.yml");

    // Read and parse the file
    try {
      const content = await fs.readFile(configPath, "utf8");
      const rawConfig = yamlLoad(content) as unknown;

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
          "Invalid catalog.yml format. Expected structure: { [alias: string]: { [packageName: string]: string } }",
          CatalogConfigurationError.INVALID_FORMAT
        );
      }

      // Cache the configuration
      this.configCache.set(cacheKey, config);

      return config;
    } catch (error) {
      if (error instanceof CatalogConfigurationError) {
        throw error;
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new CatalogConfigurationError(
          "catalog.yml not found in the workspace root",
          CatalogConfigurationError.FILE_NOT_FOUND
        );
      }
      throw new CatalogConfigurationError(
        `Failed to parse catalog.yml: ${error.message}`,
        CatalogConfigurationError.INVALID_FORMAT
      );
    }
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
        `Alias "${aliasGroupToFind}" not found in catalog.yml`,
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
   * Clear the configuration cache for a specific workspace
   */
  clearCache(workspaceRoot: string): void {
    this.configCache.delete(workspaceRoot);
  }

  private isValidConfiguration(
    config: unknown
  ): config is CatalogConfiguration {
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
