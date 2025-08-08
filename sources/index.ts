import {
  Descriptor,
  Hooks,
  Plugin,
  SettingsType,
  Workspace,
} from "@yarnpkg/core";
import { Hooks as EssentialHooks } from "@yarnpkg/plugin-essentials";
import { Hooks as PackHooks } from "@yarnpkg/plugin-pack";
import chalk from "chalk";
import { CatalogResolver } from "./CatalogResolver";
import {
  CATALOG_PROTOCOL,
  CatalogConfigurationError,
  CatalogsConfiguration,
  ROOT_ALIAS_GROUP,
  configReader,
} from "./configuration";

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs?: CatalogsConfiguration;
  }
}

// Create a singleton instance of our configuration reader
// const configReader = new CatalogConfigurationReader();

const plugin: Plugin<Hooks & EssentialHooks & PackHooks> = {
  configuration: {
    catalogs: {
      description:
        "Define dependency version ranges as reusable constants across your project.",
      type: SettingsType.ANY,
      default: {},
    },
  },
  resolvers: [CatalogResolver],
  hooks: {
    afterWorkspaceDependencyAddition: async (
      workspace: Workspace,
      __,
      dependency: Descriptor,
    ) => {
      fallbackDefaultAliasGroup(workspace, dependency);
    },
    afterWorkspaceDependencyReplacement: async (
      workspace: Workspace,
      __,
      ___,
      dependency: Descriptor,
    ) => {
      fallbackDefaultAliasGroup(workspace, dependency);
    },
    beforeWorkspacePacking: async (workspace: Workspace, rawManifest: any) => {
      // Only process if the workspace is not ignored
      if (await configReader.shouldIgnoreWorkspace(workspace)) {
        return;
      }

      const dependencyTypes = [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
      ];

      for (const dependencyType of dependencyTypes) {
        const dependencies = rawManifest[dependencyType];
        if (!dependencies || typeof dependencies !== "object") {
          continue;
        }

        for (const [packageName, versionRange] of Object.entries(
          dependencies,
        )) {
          const versionString = versionRange as string;

          // Skip if not using catalog protocol
          if (!versionString.startsWith(CATALOG_PROTOCOL)) {
            continue;
          }

          try {
            // Extract alias from catalog protocol
            const catalogAlias = versionString.slice(CATALOG_PROTOCOL.length);

            // Get the resolved version from catalog configuration
            const resolvedRange = await configReader.getRange(
              workspace.project,
              catalogAlias,
              packageName,
            );

            dependencies[packageName] = resolvedRange;
          } catch (error) {
            if (error instanceof CatalogConfigurationError) {
              throw new Error(
                `Failed to resolve catalog dependency ${packageName}@${versionString} during packaging: ${error.message}`,
              );
            }
            throw error;
          }
        }
      }
    },
  },
};

async function fallbackDefaultAliasGroup(
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
        dependency.range = `${CATALOG_PROTOCOL}${aliasGroup}`;
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

  const validationLevel = await configReader.getValidationLevel(workspace);

  const message = `➤ ${dependency.name} is listed in the catalogs config${aliasGroupsText}, but it seems you're adding it without the catalog protocol. Consider running 'yarn add ${dependency.name}@${CATALOG_PROTOCOL}${aliasGroups[0]}' instead.`;
  if (validationLevel === "strict") {
    throw new Error(chalk.red(message));
  } else if (validationLevel === "warn") {
    console.warn(chalk.yellow(message));
  }
}

// Export the plugin factory
export default plugin;
