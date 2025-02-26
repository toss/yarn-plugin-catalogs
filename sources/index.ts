import { Plugin, Project, Descriptor, structUtils, Hooks } from "@yarnpkg/core";
import {
  CatalogConfigurationReader,
  CatalogConfigurationError,
} from "./configuration";

const CATALOG_PROTOCOL = "catalog:";

// Create a singleton instance of our configuration reader
const configReader = new CatalogConfigurationReader();

function isNestedProtocol(version: string): boolean {
  // If no protocol indicator, it's not a protocol
  if (!version.includes(":")) return false;

  try {
    // Try to parse this as a descriptor to see if the protocol matches our own
    const testDescriptor = structUtils.parseDescriptor(version, true);

    // If we can parse it as a valid descriptor and it's not our own protocol,
    // check if any other plugin might handle it
    if (
      testDescriptor.range !== version &&
      !testDescriptor.range.startsWith(CATALOG_PROTOCOL)
    ) {
      // This is a valid protocol that's not our own - needs further resolution
      return true;
    }

    return false;
  } catch (e) {
    // If we can't parse it, it's likely a protocol Yarn doesn't recognize natively
    // Therefore it might need further resolution by a plugin
    return true;
  }
}

const plugin: Plugin<Hooks> = {
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

        // Get the actual version from catalog.yml
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

        // Check if this version contains another protocol that needs resolution
        if (isNestedProtocol(range)) {
          // Store a reference to our own hook

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
  },
};

// Export the plugin factory
export default plugin;
