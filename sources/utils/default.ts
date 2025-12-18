import type { Descriptor, Workspace } from "@yarnpkg/core";
import chalk from "chalk";
import { CATALOG_PROTOCOL, ROOT_ALIAS_GROUP } from "../constants";
import { configReader } from "../configuration";
import { findMatchingValidationRule } from "./validation";

export async function fallbackDefaultAliasGroup(
  workspace: Workspace,
  dependency: Descriptor,
) {
  if (dependency.range.startsWith(CATALOG_PROTOCOL)) {
    return;
  }

  // Check if validation rules apply to this workspace
  const rules = await findMatchingValidationRule(workspace);

  // If using "restrict" rule, don't suggest catalog protocol
  if (rules?.catalog_protocol_usage === "restrict") {
    return;
  }

  // Check if package exists in any catalog
  const catalogs = await configReader.getAppliedCatalogs(workspace.project);
  const packageName = dependency.name;
  const applicableGroups: string[] = [];

  if (catalogs) {
    for (const [groupName, catalog] of Object.entries(catalogs)) {
      if (catalog[packageName] !== undefined) {
        applicableGroups.push(groupName);
      }
    }
  }

  // If package is not in any catalog, nothing to do
  if (applicableGroups.length === 0) {
    return;
  }

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

  // If "always" rule is set, throw error
  if (rules?.catalog_protocol_usage === "always") {
    const message = `➤ ${dependency.name} is listed in the catalogs config, but it seems you're adding it without the catalog protocol. Consider running 'yarn add ${dependency.name}@${CATALOG_PROTOCOL}${applicableGroups[0] === ROOT_ALIAS_GROUP ? "" : applicableGroups[0]}' instead.`;
    throw new Error(chalk.red(message));
  }

  // For "optional" or no rule, show suggestion message
  const aliasGroups = applicableGroups.map((groupName) =>
    groupName === ROOT_ALIAS_GROUP ? "" : groupName,
  );

  const aliasGroupsText =
    aliasGroups.filter((aliasGroup) => aliasGroup !== "").length > 0
      ? ` (${aliasGroups.join(", ")})`
      : "";

  const message = `➤ ${dependency.name} is listed in the catalogs config${aliasGroupsText}, but it seems you're adding it without the catalog protocol. Consider running 'yarn add ${dependency.name}@${CATALOG_PROTOCOL}${aliasGroups[0]}' instead.`;
  console.warn(chalk.yellow(message));
}

/**
 * Get the default alias group from the configuration if it exists
 */
export async function getDefaultAliasGroups(
  workspace: Workspace,
): Promise<string[]> {
  const options = await configReader.getOptions(workspace.project);

  if (options) {
    if (options.default) {
      // If default value is an list of alias groups, return it
      if (Array.isArray(options.default)) {
        return options.default;
      }

      // If default value is "max", find the most frequently used alias group
      if (options.default === "max") {
        const catalogs = await configReader.getAppliedCatalogs(
          workspace.project,
        );
        const aliasGroups = Object.keys(catalogs || {});

        const dependencies = [
          ...Object.entries<string>(workspace.manifest.raw.dependencies ?? {}),
          ...Object.entries<string>(
            workspace.manifest.raw.devDependencies ?? {},
          ),
        ];
        const counts: Record<string, number> = Object.fromEntries(
          aliasGroups.map((aliasGroup) => [aliasGroup, 0]),
        );

        // Count the occurrences of each alias group in the dependencies
        for (const [_, range] of dependencies) {
          if (range.startsWith(CATALOG_PROTOCOL)) {
            const aliasGroup = range.substring(CATALOG_PROTOCOL.length);
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
