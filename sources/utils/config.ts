import {
  type Project,
  type Workspace,
  structUtils,
} from "@yarnpkg/core";
import { isMatch } from "picomatch";
import { readCatalogsYml } from "./catalogs";
import { ROOT_ALIAS_GROUP } from "../constants";
import { CatalogConfigurationError } from "../errors";
import type { CatalogsConfiguration } from "../types";

/**
 * Handles reading and parsing of .yarnrc.yml#catalogs configuration
 */
export class CatalogConfigurationReader {
  private configCache: Map<string, CatalogsConfiguration> = new Map();

  /**
   * Read configuration from catalogs.yml (options) and .yarnrc.yml (catalogs)
   */
  async readConfiguration(project: Project): Promise<CatalogsConfiguration> {
    const workspaceRoot = project.cwd;
    const cacheKey = workspaceRoot;

    // Check cache first
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Read options from catalogs.yml
    const catalogsYml = await readCatalogsYml(project);
    const options = catalogsYml?.options;

    // Read catalogs from .yarnrc.yml (Yarn's native format)
    const yarnrcCatalog = project.configuration.get("catalog");
    const yarnrcCatalogs = project.configuration.get("catalogs");

    // Combine into single structure
    const catalogs: Record<string, Record<string, string>> = {};

    // Add root catalog if exists
    if (yarnrcCatalog && typeof yarnrcCatalog === "object") {
      // Yarn stores catalog as Map<string, string>
      // We need to convert to Record<string, string>
      if (yarnrcCatalog instanceof Map) {
        catalogs[ROOT_ALIAS_GROUP] = Object.fromEntries(yarnrcCatalog.entries());
      } else {
        catalogs[ROOT_ALIAS_GROUP] = yarnrcCatalog as Record<string, string>;
      }
    }

    // Add named catalogs if exists
    if (yarnrcCatalogs && typeof yarnrcCatalogs === "object") {
      // Yarn stores catalogs as Map<string, Map<string, string>>
      // We need to convert to Record<string, Record<string, string>>
      if (yarnrcCatalogs instanceof Map) {
        for (const [groupName, group] of yarnrcCatalogs.entries()) {
          if (group instanceof Map) {
            catalogs[groupName] = Object.fromEntries(group.entries());
          } else {
            catalogs[groupName] = group as Record<string, string>;
          }
        }
      } else {
        // If it's already a plain object, just assign
        Object.assign(catalogs, yarnrcCatalogs);
      }
    }

    const config: CatalogsConfiguration = {
      options,
      catalogs,
    };

    // Validate options if present - validate against catalogs.yml list, not .yarnrc.yml catalogs
    if (options && catalogsYml) {
      const catalogsYmlGroups = Object.keys(catalogsYml.list);
      if (!this.isValidOptions(options as Record<string, unknown>, catalogsYmlGroups)) {
        throw new CatalogConfigurationError(
          "Invalid catalogs.yml options. Check that referenced catalog groups exist.",
          CatalogConfigurationError.INVALID_FORMAT,
        );
      }
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
   * Validate options against existing catalog groups from catalogs.yml
   */
  private isValidOptions(
    options: Record<string, unknown>,
    groups: string[],
  ): boolean {
    // Validate default option
    if ("default" in options && options.default) {
      if (Array.isArray(options.default)) {
        for (const group of options.default) {
          if (typeof group !== "string") {
            return false;
          }
          if (group !== ROOT_ALIAS_GROUP && !groups.includes(group)) {
            return false;
          }
        }
      } else if (options.default !== "max") {
        return false;
      }
    }

    // Validate validation option
    if ("validation" in options && options.validation) {
      const validation = options.validation;
      if (typeof validation === "object" && validation !== null) {
        for (const [groupName, _] of Object.entries(validation)) {
          if (groupName !== ROOT_ALIAS_GROUP && !groups.includes(groupName)) {
            return false;
          }
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

export const configReader = new CatalogConfigurationReader();
