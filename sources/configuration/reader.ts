import {
  type Descriptor,
  type Project,
  structUtils,
  type Workspace,
} from "@yarnpkg/core";
import { isMatch } from "picomatch";
import type { CatalogsConfiguration } from "./types";
import { CatalogConfigurationError } from "./errors";
import { ROOT_ALIAS_GROUP, CATALOG_PROTOCOL } from "../constants";
import type { ValidationLevel } from "../types";
import { getInheritanceChain } from "../utils";

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

    const config = rawConfig;
    // Transform config to handle root-level string values
    if (rawConfig.list) {
      config.list = Object.entries(rawConfig.list).reduce(
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
        {} as Record<string, object>,
      );
    } else {
      config.list = {};
    }

    // Validate configuration structure
    if (!this.isValidConfiguration(config)) {
      throw new CatalogConfigurationError(
        "Invalid catalogs configuration format. Expected structure: { options?: { default?: string[] | 'max', ignoredWorkspaces?: string[], validation?: 'off' | 'warn' | 'strict' | { [package: string]: 'off' | 'warn' | 'strict' } }, list: { [alias: string]: { [packageName: string]: string } } }",
        CatalogConfigurationError.INVALID_FORMAT,
      );
    }

    // Validate inheritance structure
    if (!this.validateInheritanceStructure(config)) {
      throw new CatalogConfigurationError(
        "Invalid inheritance structure in catalogs configuration. Check for missing parent groups.",
        CatalogConfigurationError.INVALID_ALIAS,
      );
    }

    // Cache the configuration
    this.configCache.set(cacheKey, config);

    return config;
  }

  /**
   * Clear the configuration cache for a specific workspace
   */
  clearCache(project: Project): void {
    const workspaceRoot = project.cwd;
    this.configCache.delete(workspaceRoot);
  }

  /**
   * Validate inheritance structure in configuration
   */
  private validateInheritanceStructure(config: CatalogsConfiguration): boolean {
    if (!config.list) return true;

    const groups = Object.keys(config.list);

    for (const group of groups) {
      // Skip root-level string values
      if (typeof config.list[group] === "string") continue;

      // Validate that parent groups exist
      if (group.includes("/")) {
        const chain = getInheritanceChain(group);
        for (let i = 0; i < chain.length - 1; i++) {
          const parentGroup = chain[i];
          if (
            !groups.includes(parentGroup) &&
            parentGroup !== ROOT_ALIAS_GROUP
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private isValidConfiguration(
    config: unknown,
  ): config is CatalogsConfiguration {
    if (!config || typeof config !== "object") {
      return false;
    }

    // The list property must be an object
    if (
      !("list" in config) ||
      !config.list ||
      typeof config.list !== "object"
    ) {
      return false;
    }

    for (const [_, aliasConfig] of Object.entries(config.list)) {
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
      config.options &&
      typeof config.options === "object"
    ) {
      if (
        "ignoredWorkspaces" in config.options &&
        config.options.ignoredWorkspaces
      ) {
        if (!Array.isArray(config.options.ignoredWorkspaces)) {
          return false;
        }

        if (config.options.ignoredWorkspaces.length === 0) {
          return false;
        }
      }

      if ("default" in config.options && config.options.default) {
        if (Array.isArray(config.options.default)) {
          if (config.options.default.length === 0) {
            return false;
          }

          const aliasGroups = Object.keys(config.list || {});
          for (const group of config.options.default) {
            if (group !== "root" && !aliasGroups.includes(group)) {
              // Check if it's a valid inheritance chain
              if (group.includes("/")) {
                const chain = getInheritanceChain(group);
                let isValid = true;
                for (const chainGroup of chain) {
                  if (
                    chainGroup !== "root" &&
                    !aliasGroups.includes(chainGroup)
                  ) {
                    isValid = false;
                    break;
                  }
                }
                if (!isValid) {
                  return false;
                }
              } else {
                return false;
              }
            }
          }
        } else {
          if (typeof config.options.default !== "string") {
            return false;
          }

          if (config.options.default !== "max") {
            return false;
          }
        }
      }

      if ("validation" in config.options) {
        const validation = config.options.validation;

        if (typeof validation === "string") {
          if (!["warn", "strict", "off"].includes(validation)) {
            return false;
          }
        } else if (typeof validation === "object" && validation !== null) {
          // Validate group-specific validation config
          for (const [groupName, level] of Object.entries(validation)) {
            if (
              typeof level !== "string" ||
              !["warn", "strict", "off"].includes(level)
            ) {
              return false;
            }

            // Validate that the group exists or is a valid inheritance chain
            const aliasGroups = Object.keys(config.list || {});
            if (
              !aliasGroups.includes(groupName) &&
              groupName !== ROOT_ALIAS_GROUP
            ) {
              if (groupName.includes("/")) {
                const chain = getInheritanceChain(groupName);
                let isValid = true;
                for (const chainGroup of chain) {
                  if (
                    chainGroup !== ROOT_ALIAS_GROUP &&
                    !aliasGroups.includes(chainGroup)
                  ) {
                    isValid = false;
                    break;
                  }
                }
                if (!isValid) {
                  return false;
                }
              } else {
                return false;
              }
            }
          }
        } else {
          return false;
        }
      }
    }

    return true;
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
}
