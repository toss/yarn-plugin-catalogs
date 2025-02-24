import { Plugin, Project, Descriptor, structUtils } from "@yarnpkg/core";
import {
  CatalogConfigurationReader,
  CatalogConfigurationError,
} from "./configuration";

// Create a singleton instance of our configuration reader
const configReader = new CatalogConfigurationReader();

const plugin: Plugin = {
  hooks: {
    reduceDependency: async (dependency: Descriptor, project: Project) => {
      // Log the dependency being processed
      console.log("Processing dependency:", dependency.name, dependency.range);

      // Check if this is a catalog dependency
      if (!dependency.range.startsWith("catalog:")) {
        console.log("Not a catalog dependency, skipping");
        return dependency;
      }

      try {
        // Extract the alias from the range
        const catalogAlias = dependency.range.slice("catalog:".length);
        console.log("Found catalog alias:", catalogAlias);

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
        console.log("Resolved version:", version);

        // Create a new descriptor with the resolved version
        const newDescriptor = structUtils.makeDescriptor(
          structUtils.makeIdent(dependency.scope, dependency.name),
          version
        );
        console.log(
          "Created new descriptor:",
          newDescriptor.name,
          newDescriptor.range
        );

        return newDescriptor;
      } catch (error) {
        console.error("Error resolving dependency:", error);
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
