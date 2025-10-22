import type { Workspace } from "@yarnpkg/core";
import type { CatalogConfigurationReader } from "./configuration";
import type { ValidationLevel } from "../types";
import { CATALOG_PROTOCOL } from "../constants";

/**
 * Package violation information for validation
 */
export interface PackageViolation {
  packageName: string;
  validationLevel: "warn" | "strict";
  applicableGroups: string[];
}

/**
 * Result of workspace validation
 */
export interface WorkspaceValidationResult {
  /** Dependencies that violate catalog usage rules */
  violations: PackageViolation[];
  /** Whether workspace is ignored */
  isIgnored: boolean;
  /** Whether workspace has catalog protocol despite being ignored */
  hasCatalogProtocolWhenIgnored: boolean;
}

/**
 * Service for handling catalog validation logic
 */
export class Validator {
  constructor(private configReader: CatalogConfigurationReader) {}

  /**
   * Get validation level for a specific group
   */
  private async getGroupValidationLevel(
    workspace: Workspace,
    groupName: string,
  ): Promise<ValidationLevel> {
    const config = await this.configReader.readConfiguration(workspace.project);
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
    const accessibleGroups = await this.configReader.findAllAccessibleGroups(
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
   * Get general validation level from configuration
   */
  async getValidationLevel(workspace: Workspace): Promise<ValidationLevel> {
    const config = await this.configReader.readConfiguration(workspace.project);

    if (config.options?.validation) {
      if (typeof config.options.validation === "string") {
        return config.options.validation;
      }
    }

    return "warn";
  }

  /**
   * Check all dependencies in a workspace and find violations
   * Returns packages that are in catalogs but not using catalog protocol
   */
  async getCatalogDependenciesWithoutProtocol(
    workspace: Workspace,
  ): Promise<PackageViolation[]> {
    const dependencyEntries = [
      ...Object.entries(workspace.manifest.raw.dependencies || {}),
      ...Object.entries(workspace.manifest.raw.devDependencies || {}),
    ];

    const results: PackageViolation[] = [];

    for (const [packageName, version] of dependencyEntries) {
      const versionString = version as string;

      // Skip if already using catalog protocol
      if (versionString.startsWith(CATALOG_PROTOCOL)) {
        continue;
      }

      // Find all groups that can access this package
      const accessibleGroups = await this.configReader.findAllAccessibleGroups(
        workspace.project,
        packageName,
      );

      if (accessibleGroups.length > 0) {
        const validationLevel = await this.getValidationLevelForPackage(
          workspace,
          packageName,
        );

        // Only include packages that have validation enabled (not 'off')
        if (validationLevel !== "off") {
          results.push({
            packageName,
            validationLevel: validationLevel as "warn" | "strict",
            applicableGroups: accessibleGroups,
          });
        }
      }
    }

    return results;
  }

  /**
   * Validate workspace and return validation result
   * This is the main entry point for workspace validation
   */
  async validateWorkspace(
    workspace: Workspace,
  ): Promise<WorkspaceValidationResult> {
    const isIgnored = await this.configReader.shouldIgnoreWorkspace(workspace);

    // Check if any dependencies in manifest are in catalog but not using catalog protocol
    const violations = isIgnored
      ? []
      : await this.getCatalogDependenciesWithoutProtocol(workspace);

    // Check the workspace's raw manifest to find dependencies with the catalog protocol
    const hasCatalogProtocol = [
      ...Object.values(workspace.manifest.raw.dependencies || {}),
      ...Object.values(workspace.manifest.raw.devDependencies || {}),
    ].some((version) => (version as string).startsWith(CATALOG_PROTOCOL));

    return {
      violations,
      isIgnored,
      hasCatalogProtocolWhenIgnored: isIgnored && hasCatalogProtocol,
    };
  }
}
