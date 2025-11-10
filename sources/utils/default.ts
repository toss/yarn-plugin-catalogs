import type { Descriptor, Workspace } from "@yarnpkg/core";
import chalk from "chalk";
import { configReader } from "./config";
import { CATALOG_PROTOCOL, ROOT_ALIAS_GROUP } from "../constants";
import { validateCatalogUsability } from "./validation";

export async function fallbackDefaultAliasGroup(
  workspace: Workspace,
  dependency: Descriptor,
) {
  if (dependency.range.startsWith(CATALOG_PROTOCOL)) {
    if (await configReader.shouldIgnoreWorkspace(workspace)) {
      throw new Error(
        chalk.red(
          "The workspace is ignored from the catalogs, but the dependency to add is using the catalog protocol. Consider removing the protocol.",
        ),
      );
    }
    return;
  }

  const validationInfo = await validateCatalogUsability(workspace, dependency);

  // If no applicable groups found, return early
  if (!validationInfo) return;

  const { validationLevel, applicableGroups } = validationInfo;

  // If there's a default alias group, fallback to it
  const defaultAliasGroups = await getDefaultAliasGroups(workspace);
  if (defaultAliasGroups.length > 0) {
    for (const aliasGroup of defaultAliasGroups) {
      if (applicableGroups.includes(aliasGroup)) {
        // Root catalog uses "catalog:" without group name, others use "catalog:groupName"
        const catalogRange =
          aliasGroup === ROOT_ALIAS_GROUP
            ? CATALOG_PROTOCOL
            : `${CATALOG_PROTOCOL}${aliasGroup}`;
        dependency.range = catalogRange;
        return;
      }
    }
  }

  // If no default alias group is specified, show warning message
  const aliasGroups = applicableGroups.map((groupName) =>
    groupName === ROOT_ALIAS_GROUP ? "" : groupName,
  );

  const aliasGroupsText =
    aliasGroups.filter((aliasGroup) => aliasGroup !== "").length > 0
      ? ` (${aliasGroups.join(", ")})`
      : "";

  const message = `➤ ${dependency.name} is listed in the catalogs config${aliasGroupsText}, but it seems you're adding it without the catalog protocol. Consider running 'yarn add ${dependency.name}@${CATALOG_PROTOCOL}${aliasGroups[0]}' instead.`;
  if (validationLevel === "strict") {
    throw new Error(chalk.red(message));
  }

  if (validationLevel === "warn") {
    console.warn(chalk.yellow(message));
  }
}

/**
 * Get the default alias group from the configuration if it exists
 */
export async function getDefaultAliasGroups(
  workspace: Workspace,
): Promise<string[]> {
  const config = await configReader.readConfiguration(workspace.project);

  if (config.options) {
    // There's no default alias group if the workspace should be ignored
    if (await configReader.shouldIgnoreWorkspace(workspace)) {
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
