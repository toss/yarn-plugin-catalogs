import { Descriptor, Project, structUtils, Workspace } from "@yarnpkg/core";
import { isMatch } from "picomatch";

export const ROOT_ALIAS_GROUP = "root";

export const CATALOG_PROTOCOL = "catalog:";

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs?: CatalogsConfiguration;
  }
}

type ValidationLevel = "warn" | "strict" | "off";
type ValidationConfig =
  | ValidationLevel
  | { [groupName: string]: ValidationLevel };

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
     * - 'off': Disable validation
     * Can also be an object with group-specific settings: { [groupName]: 'warn' | 'strict' | 'off' }
     */
    validation?: ValidationConfig;
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
   * Parse inheritance chain from group name
   * e.g., "stable/canary/next" to ["stable", "stable/canary", "stable/canary/next"]
   */
  private getInheritanceChain(groupName: string): string[] {
    const parts = groupName.split("/");
    const chain: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      chain.push(parts.slice(0, i + 1).join("/"));
    }

    return chain;
  }

  /**
   * Resolve package version through inheritance chain
   */
  private resolveInheritedRange(
    config: CatalogsConfiguration,
    groupName: string,
    packageName: string,
  ): string | null {
    const chain = this.getInheritanceChain(groupName);

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
        const chain = this.getInheritanceChain(group);
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
    if (rawConfig["list"]) {
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
        {} as Record<string, object>,
      );
    } else {
      config["list"] = {};
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
   * Get a specific version from the configuration
   */
  async getRange(
    project: Project,
    aliasGroup: string,
    packageName: string,
  ): Promise<string> {
    const config = await this.readConfiguration(project);

    const aliasGroupToFind =
      aliasGroup.length === 0 ? ROOT_ALIAS_GROUP : aliasGroup;

    // Try to resolve through inheritance chain first
    const inheritedVersion = this.resolveInheritedRange(
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
   * Get validation level for a specific group (considering inheritance)
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

    // Search inheritance chain for explicit validation setting
    const inheritanceChain = this.getInheritanceChain(groupName);

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
  async getValidationLevelForPackage(
    workspace: Workspace,
    descriptor: Descriptor,
  ): Promise<ValidationLevel> {
    const accessibleGroups = (
      await this.findDependency(workspace.project, descriptor)
    ).map(({ groupName }) => groupName);

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
   * This method now includes inherited groups in the results.
   */
  async findDependency(
    project: Project,
    dependency: Descriptor,
  ): Promise<Array<{ groupName: string; version: string }>> {
    const dependencyString = structUtils.stringifyIdent(dependency);
    const config = await this.readConfiguration(project);
    const results: Array<{ groupName: string; version: string }> = [];

    // Use resolveInheritedRange for all groups to handle both direct and inherited matches
    for (const groupName of Object.keys(config.list || {})) {
      const resolvedVersion = this.resolveInheritedRange(
        config,
        groupName,
        dependencyString,
      );

      if (resolvedVersion) {
        results.push({ groupName, version: resolvedVersion });
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

  private isValidConfiguration(
    config: unknown,
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

          const aliasGroups = Object.keys(config.list || {});
          for (const group of config.options.default) {
            if (group !== "root" && !aliasGroups.includes(group)) {
              // Check if it's a valid inheritance chain
              if (group.includes("/")) {
                const chain = this.getInheritanceChain(group);
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
          if (typeof config["options"]["default"] !== "string") {
            return false;
          }

          if (config["options"]["default"] !== "max") {
            return false;
          }
        }
      }

      if ("validation" in config["options"]) {
        const validation = config["options"]["validation"];

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
                const chain = this.getInheritanceChain(groupName);
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
}
