import {
  Plugin,
  Project,
  Descriptor,
  structUtils,
  Hooks,
  SettingsType,
  Workspace,
  MessageName,
} from "@yarnpkg/core";
import { Hooks as EssentialHooks } from '@yarnpkg/plugin-essentials';
import chalk from 'chalk';
import {
  CatalogConfigurationReader,
  CatalogConfigurationError,
  CatalogsConfiguration,
  CATALOG_PROTOCOL,
  ROOT_ALIAS_GROUP,
} from "./configuration";

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs: CatalogsConfiguration;
  }
}

// Create a singleton instance of our configuration reader
const configReader = new CatalogConfigurationReader();

const plugin: Plugin<Hooks & EssentialHooks> = {
  configuration: {
    catalogs: {
      description:
        "Define dependency version ranges as reusable constants across your project.",
      type: SettingsType.ANY,
      default: {},
    },
  },
  hooks: {
    validateWorkspace: async (workspace: Workspace, report) => {
      // Check the workspace's raw manifest to find dependencies with the catalog protocol
      const hasCatalogProtocol = [
        ...Object.values(workspace.manifest.raw["dependencies"] || {}),
        ...Object.values(workspace.manifest.raw["devDependencies"] || {}),
      ].some((version: string) => version.startsWith(CATALOG_PROTOCOL));

      if (await configReader.shouldIgnoreWorkspace(workspace) && hasCatalogProtocol) {
        report.reportError(
          MessageName.INVALID_MANIFEST,
          `Workspace is ignored from the catalogs, but it has dependencies with the catalog protocol. Consider removing the protocol.`,
        );
      }
    },
    reduceDependency: async (
      dependency: Descriptor,
      project: Project,
      ...extraArgs
    ) => {
      // Skip if not our protocol or if this is a recursive call
      if (!dependency.range.startsWith(CATALOG_PROTOCOL)) {
        return dependency;
      }

      try {
        // Extract the alias from the range
        const catalogAlias = dependency.range.slice(CATALOG_PROTOCOL.length);
        const dependencyName = structUtils.stringifyIdent(dependency);

        // Get the actual version from .yarnrc.yml
        const range = await configReader.getRange(
          project,
          catalogAlias,
          dependencyName
        );

        // Create a new descriptor with the resolved version
        const resolvedDescriptor = structUtils.makeDescriptor(
          structUtils.makeIdent(dependency.scope, dependency.name),
          range
        );

        // Trigger other hooks to be sure the descriptor is fully resolved
        const result = await project.configuration.reduceHook(
          (hooks) => hooks.reduceDependency,
          resolvedDescriptor,
          project,
          ...extraArgs
        );

        if (result !== resolvedDescriptor) {
          return result;
        }

        return resolvedDescriptor;
      } catch (error) {
        if (error instanceof CatalogConfigurationError) {
          throw new Error(
            `Failed to resolve ${structUtils.stringifyDescriptor(
              dependency
            )}: ${error.message}`
          );
        }
        throw error;
      }
    },
    afterWorkspaceDependencyAddition: async (workspace: Workspace, __, dependency: Descriptor) => {
      fallbackDefaultAliasGroup(workspace, dependency);
    },
    afterWorkspaceDependencyReplacement: async (workspace: Workspace, __, ___, dependency: Descriptor) => {
      fallbackDefaultAliasGroup(workspace, dependency);
    },
  },
};

async function fallbackDefaultAliasGroup(workspace: Workspace, dependency: Descriptor) {
  if (dependency.range.startsWith(CATALOG_PROTOCOL)) {
    if (await configReader.shouldIgnoreWorkspace(workspace)) {
      throw new Error(chalk.red(`The workspace is ignored from the catalogs, but the dependency to add is using the catalog protocol. Consider removing the protocol.`));
    }
    return;
  }

  if (await configReader.shouldIgnoreWorkspace(workspace)) return;

  const aliases = await configReader.findDependency(workspace.project, dependency);
  if (aliases.length === 0) return;

  // If there's a default alias group, fallback to it
  const defaultAliasGroups = await configReader.getDefaultAliasGroups(workspace);
  if (defaultAliasGroups.length > 0) {
    for (const aliasGroup of defaultAliasGroups) {
      if (aliases.some(([alias]) => alias === aliasGroup)) {
        dependency.range = `${CATALOG_PROTOCOL}${aliasGroup}`;
        return;
      }
    }
  };

  // If no default alias group is specified, show warning message
  const aliasGroups = aliases.map(([aliasGroup]) => (
    aliasGroup === ROOT_ALIAS_GROUP ? "" : aliasGroup
  ));

  const aliasGroupsText = aliasGroups.filter(aliasGroup => aliasGroup !== "").length > 0
    ? ` (${aliasGroups.join(", ")})` : "";

  console.warn(chalk.yellow(`➤ ${dependency.name} is listed in the catalogs config${aliasGroupsText}, but it seems you're adding it without the catalog protocol. Consider running 'yarn add ${dependency.name}@${CATALOG_PROTOCOL}${aliasGroups[0]}' instead.`));
}

// Export the plugin factory
export default plugin;
