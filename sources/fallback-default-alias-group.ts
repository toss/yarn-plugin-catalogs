import { Descriptor, Workspace } from "@yarnpkg/core";
import chalk from "chalk";
import { CATALOG_PROTOCOL, ROOT_ALIAS_GROUP } from "./configuration";
import { configReader } from "./config-reader";
import { getValidationInfoForNonCatalogDependency } from "./get-validation-info-for-non-catalog-dependency";

export async function fallbackDefaultAliasGroup(
  workspace: Workspace,
  dependency: Descriptor,
) {
  if (dependency.range.startsWith(CATALOG_PROTOCOL)) {
    if (await configReader.shouldIgnoreWorkspace(workspace)) {
      throw new Error(
        chalk.red(
          `The workspace is ignored from the catalogs, but the dependency to add is using the catalog protocol. Consider removing the protocol.`,
        ),
      );
    }
    return;
  }

  const validationInfo = await getValidationInfoForNonCatalogDependency(
    workspace,
    dependency,
  );

  // If no applicable groups found, return early
  if (!validationInfo) return;

  const { validationLevel, applicableGroups } = validationInfo;

  // If there's a default alias group, fallback to it
  const defaultAliasGroups = await configReader.getDefaultAliasGroups(
    workspace,
  );
  if (defaultAliasGroups.length > 0) {
    for (const aliasGroup of defaultAliasGroups) {
      if (applicableGroups.includes(aliasGroup)) {
        dependency.range = `${CATALOG_PROTOCOL}${aliasGroup}`;
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
  } else if (validationLevel === "warn") {
    console.warn(chalk.yellow(message));
  }
}
