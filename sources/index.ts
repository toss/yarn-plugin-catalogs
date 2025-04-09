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
} from "./configuration";

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs: CatalogsConfiguration;
  }
}

const CATALOG_PROTOCOL = "catalog:";

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
    afterWorkspaceDependencyAddition: async (_, __, dependency: Descriptor) => {
      // do something
    },
    afterWorkspaceDependencyReplacement: async (_, __, ___, dependency: Descriptor) => {
      // do something
    },
  },
};

// Export the plugin factory
export default plugin;
