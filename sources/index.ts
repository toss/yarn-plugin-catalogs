import { Plugin, Project, Descriptor, structUtils } from "@yarnpkg/core";
import {
  CatalogConfigurationReader,
  CatalogConfigurationError,
} from "./configuration";

const CATALOG_PROTOCOL = "catalog:";

// Create a singleton instance of our configuration reader
const configReader = new CatalogConfigurationReader();

const plugin: Plugin = {
  hooks: {
    reduceDependency: async (dependency: Descriptor, project: Project) => {
      if (!dependency.range.startsWith(CATALOG_PROTOCOL)) {
        return dependency;
      }

      try {
        // Extract the alias from the range
        const catalogAlias = dependency.range.slice(CATALOG_PROTOCOL.length);
        const dependencyName =
          dependency.scope?.length > 0
            ? `@${dependency.scope}/${dependency.name}`
            : dependency.name;

        // Get the actual version from catalog.yml
        const version = await configReader.getVersion(
          project,
          catalogAlias,
          dependencyName
        );

        // Create a new descriptor with the resolved version
        const newDescriptor = structUtils.makeDescriptor(
          structUtils.makeIdent(dependency.scope, dependency.name),
          version
        );

        return newDescriptor;
      } catch (error) {
        if (error instanceof CatalogConfigurationError) {
          throw new Error(
            `Failed to resolve ${dependency.name}@${dependency.range}: ${error.message}`
          );
        }
        throw error;
      }
    },
  },
};

// Export the plugin factory
export default plugin;
