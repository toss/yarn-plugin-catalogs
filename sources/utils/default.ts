import { type Descriptor, type Workspace, structUtils } from "@yarnpkg/core";
import chalk from "chalk";
import type { CatalogConfigurationReader } from "./configuration";
import { CATALOG_PROTOCOL, ROOT_ALIAS_GROUP } from "../constants";

/**
 * Service for handling default alias group logic
 */
export class DefaultAliasResolver {
  constructor(
    private configReader: CatalogConfigurationReader,
    private validationService: {
      getValidationLevelForPackage: (
        workspace: Workspace,
        packageName: string,
      ) => Promise<string>;
    },
  ) {}

  /**
   * Get the default alias group from the configuration if it exists
   */
  private async getDefaultAliasGroups(workspace: Workspace): Promise<string[]> {
    const config = await this.configReader.readConfiguration(workspace.project);

    if (config.options) {
      // There's no default alias group if the workspace should be ignored
      if (await this.configReader.shouldIgnoreWorkspace(workspace)) {
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
   * Apply default alias group when adding/replacing a dependency
   */
  async applyDefaultAlias(
    workspace: Workspace,
    target: string,
    dependency: Descriptor,
  ): Promise<void> {
    if (dependency.range.startsWith(CATALOG_PROTOCOL)) {
      if (await this.configReader.shouldIgnoreWorkspace(workspace)) {
        throw new Error(
          chalk.red(
            `The workspace is ignored from the catalogs, but the dependency to add is using the catalog protocol. Consider removing the protocol.`,
          ),
        );
      }
      return;
    }

    if (await this.configReader.shouldIgnoreWorkspace(workspace)) return;

    const aliases = await this.configReader.findDependency(
      workspace.project,
      dependency,
    );

    if (aliases.length === 0) return;

    // If there's a default alias group, fallback to it
    const defaultAliasGroups = await this.getDefaultAliasGroups(workspace);

    if (defaultAliasGroups.length > 0) {
      for (const aliasGroup of defaultAliasGroups) {
        if (aliases.some(([alias]) => alias === aliasGroup)) {
          // For root catalog, use empty string after "catalog:"
          // For named catalogs, use the catalog name
          const catalogName = aliasGroup === ROOT_ALIAS_GROUP ? "" : aliasGroup;
          const catalogProtocol = `${CATALOG_PROTOCOL}${catalogName}`;
          // Update the manifest directly
          const manifestField =
            workspace.manifest[target as keyof typeof workspace.manifest];
          if (
            manifestField &&
            typeof manifestField === "object" &&
            "set" in manifestField
          ) {
            manifestField.set(
              dependency.identHash,
              structUtils.makeDescriptor(dependency, catalogProtocol),
            );
          }
          return;
        }
      }
    }

    // If no default alias group is specified, show warning message
    const aliasGroups = aliases.map(([aliasGroup]) =>
      aliasGroup === ROOT_ALIAS_GROUP ? "" : aliasGroup,
    );

    const aliasGroupsText =
      aliasGroups.filter((aliasGroup) => aliasGroup !== "").length > 0
        ? ` (${aliasGroups.join(", ")})`
        : "";

    const validationLevel =
      await this.validationService.getValidationLevelForPackage(
        workspace,
        structUtils.stringifyIdent(dependency),
      );

    const message = `➤ ${dependency.name} is listed in the catalogs config${aliasGroupsText}, but it seems you're adding it without the catalog protocol. Consider running 'yarn add ${dependency.name}@${CATALOG_PROTOCOL}${aliasGroups[0]}' instead.`;
    if (validationLevel === "strict") {
      throw new Error(chalk.red(message));
    } else if (validationLevel === "warn") {
      console.warn(chalk.yellow(message));
    }
  }
}
