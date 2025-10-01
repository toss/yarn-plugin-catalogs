import {
  type Plugin,
  type Descriptor,
  structUtils,
  type Hooks,
  type Workspace,
  MessageName,
} from "@yarnpkg/core";
import type { Hooks as EssentialHooks } from "@yarnpkg/plugin-essentials";
import chalk from "chalk";
import {
  CatalogConfigurationReader,
  CATALOG_PROTOCOL,
  ROOT_ALIAS_GROUP,
} from "./configuration";

// Create a singleton instance of our configuration reader
const configReader = new CatalogConfigurationReader();

const plugin: Plugin<Hooks & EssentialHooks> = {
  hooks: {
    validateWorkspace: async (workspace: Workspace, report) => {
      const shouldIgnore = await configReader.shouldIgnoreWorkspace(workspace);

      // Check if any dependencies in manifest are in catalog but not using catalog protocol
      if (!shouldIgnore) {
        const violatedDependencies =
          await getCatalogDependenciesWithoutProtocol(workspace);

        if (violatedDependencies.length > 0) {
          // Group dependencies by validation level
          const strictViolations = violatedDependencies.filter(
            (dep) => dep.validationLevel === "strict",
          );
          const warnViolations = violatedDependencies.filter(
            (dep) => dep.validationLevel === "warn",
          );

          const message = (
            violations: typeof strictViolations | typeof warnViolations,
          ) => {
            const packageList = violations
              .map((dep) => chalk.yellow(dep.packageName))
              .join(", ");
            return `The following dependencies are listed in the catalogs but not using the catalog protocol: ${packageList}. Consider using the catalog protocol instead.`;
          };

          if (strictViolations.length > 0) {
            report.reportError(
              MessageName.INVALID_MANIFEST,
              message(strictViolations),
            );
          }

          if (warnViolations.length > 0) {
            report.reportWarning(
              MessageName.INVALID_MANIFEST,
              message(warnViolations),
            );
          }
        }
      }

      // Check the workspace's raw manifest to find dependencies with the catalog protocol
      const hasCatalogProtocol = [
        ...Object.values(workspace.manifest.raw.dependencies || {}),
        ...Object.values(workspace.manifest.raw.devDependencies || {}),
      ].some((version) => (version as string).startsWith(CATALOG_PROTOCOL));

      if (shouldIgnore && hasCatalogProtocol) {
        report.reportError(
          MessageName.INVALID_MANIFEST,
          `Workspace is ignored from the catalogs, but it has dependencies with the catalog protocol. Consider removing the protocol.`,
        );
      }
    },
    afterWorkspaceDependencyAddition: async (
      workspace: Workspace,
      target: string,
      dependency: Descriptor,
    ) => {
      await fallbackDefaultAliasGroup(workspace, target, dependency);
    },
    afterWorkspaceDependencyReplacement: async (
      workspace: Workspace,
      target: string,
      _fromDescriptor: Descriptor,
      dependency: Descriptor,
    ) => {
      await fallbackDefaultAliasGroup(workspace, target, dependency);
    },
  },
};

async function getCatalogDependenciesWithoutProtocol(
  workspace: Workspace,
): Promise<
  Array<{
    packageName: string;
    validationLevel: "warn" | "strict";
    applicableGroups: string[];
  }>
> {
  const dependencyEntries = [
    ...Object.entries(workspace.manifest.raw.dependencies || {}),
    ...Object.entries(workspace.manifest.raw.devDependencies || {}),
  ];

  const results = [];

  for (const [packageName, version] of dependencyEntries) {
    const versionString = version as string;

    // Skip if already using catalog protocol
    if (versionString.startsWith(CATALOG_PROTOCOL)) {
      continue;
    }

    // Find all groups that can access this package
    const accessibleGroups = await configReader.findAllAccessibleGroups(
      workspace.project,
      packageName,
    );

    if (accessibleGroups.length > 0) {
      const validationLevel = await configReader.getValidationLevelForPackage(
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

async function fallbackDefaultAliasGroup(
  workspace: Workspace,
  target: string,
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

  if (await configReader.shouldIgnoreWorkspace(workspace)) return;

  const aliases = await configReader.findDependency(
    workspace.project,
    dependency,
  );

  if (aliases.length === 0) return;

  // If there's a default alias group, fallback to it
  const defaultAliasGroups =
    await configReader.getDefaultAliasGroups(workspace);

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

  const validationLevel = await configReader.getValidationLevelForPackage(
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

// Export the plugin factory
export default plugin;
