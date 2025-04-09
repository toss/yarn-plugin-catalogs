import {
  Plugin,
  Project,
  Descriptor,
  structUtils,
  Hooks,
  SettingsType,
  Workspace,
} from "@yarnpkg/core";
import { Hooks as EssentialHooks } from '@yarnpkg/plugin-essentials';
import {
  CatalogConfigurationReader,
  CatalogConfigurationError,
  CatalogsConfiguration,
  CATALOG_PROTOCOL,
  DEFAULT_ALIAS_GROUP,
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
      recommendCatalogProtocol(workspace, dependency);
    },
    afterWorkspaceDependencyReplacement: async (workspace: Workspace, __, ___, dependency: Descriptor) => {
      recommendCatalogProtocol(workspace, dependency);
    },
  },
};

async function recommendCatalogProtocol(workspace: Workspace, dependency: Descriptor) {
  if (dependency.range.startsWith(CATALOG_PROTOCOL)) return;

  const [aliasGroup, version] = await configReader.hasDependency(workspace.project, dependency);
  const aliasGroupText = aliasGroup === DEFAULT_ALIAS_GROUP ? "" : aliasGroup;

  console.warn(`${dependency.name} is in the catalogs config (${version}), but it's not using the catalog protocol. You might want to run 'yarn add ${dependency.name}@catalogs:${aliasGroupText}' instead.`);
}

// Export the plugin factory
export default plugin;
