/**
 * Yarn plugin for mapping package versions through a catalog.yml file using a custom protocol.
 *
 * Features:
 * - Allows defining sets of package versions in a central catalog.yml file
 * - Provides a "catalog:" protocol for referencing these versions
 * - Supports nesting of protocols for integration with other custom protocol plugins
 * - Automatically falls back to npm: protocol for unqualified versions
 *
 * Usage:
 * 1. Create a catalog.yml file in your workspace root
 * 2. Define version aliases in the file (e.g., stable: { react: "18.0.0" })
 * 3. Reference these versions in package.json using the catalog: protocol
 *    (e.g., "react": "catalog:stable")
 *
 * Chained Protocol Resolution:
 * This plugin also supports resolving nested custom protocols. For example:
 *
 * catalog.yml:
 * ```
 * stable:
 *   react: "custom-protocol:18.0.0"
 * ```
 *
 * package.json:
 * ```
 * "dependencies": {
 *   "react": "catalog:stable"
 * }
 * ```
 *
 * This will first resolve to "custom-protocol:18.0.0" and then further resolve
 * that protocol using any other plugins that handle the custom-protocol.
 */

import { Plugin, Project, Descriptor, structUtils } from "@yarnpkg/core";
import {
  CatalogConfigurationReader,
  CatalogConfigurationError,
} from "./configuration";

const CATALOG_PROTOCOL = "catalog:";

// Create a singleton instance of our configuration reader
const configReader = new CatalogConfigurationReader();

/**
 * Determines whether a version string contains a protocol that needs further resolution
 * from another plugin.
 *
 * This function uses a more sophisticated approach than hardcoding a list of known protocols:
 * 1. It attempts to parse the version as a descriptor using Yarn's structUtils
 * 2. If parsing succeeds and the result isn't identical to the input (meaning it was recognized),
 *    and it's not our own protocol, it's likely a protocol handled by another plugin
 * 3. If parsing fails, it might be a custom protocol that needs special handling
 *
 * This approach is more future-proof than hardcoding known protocols, as it will
 * automatically work with new protocols added in future Yarn versions.
 *
 * @param version - The version string to check (e.g., "npm:1.0.0", "test-protocol:1.0.0")
 * @param project - The Yarn project instance
 * @returns True if the version contains a protocol that needs further resolution
 */
function isNestedProtocol(version: string, project: Project): boolean {
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

const plugin: Plugin = {
  hooks: {
    reduceDependency: async (
      dependency: Descriptor,
      project: Project,
      initialContext: any
    ) => {
      // Skip if not our protocol or if this is a recursive call
      if (
        !dependency.range.startsWith(CATALOG_PROTOCOL) ||
        initialContext?.isRecursive
      ) {
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
        const resolvedDescriptor = structUtils.makeDescriptor(
          structUtils.makeIdent(dependency.scope, dependency.name),
          version
        );

        // Check if this version contains another protocol that needs resolution
        if (isNestedProtocol(version, project)) {
          // Store a reference to our own hook
          const ourHook = plugin.hooks.reduceDependency;

          // Use a different approach: manually iterate through plugins' hooks
          for (const p of project.configuration.plugins.values()) {
            if (!p.hooks?.reduceDependency) continue;
            if (p.hooks.reduceDependency === ourHook) continue; // Skip ourselves

            // Try to resolve with other plugins
            const result = await p.hooks.reduceDependency(
              resolvedDescriptor,
              project,
              null,
              null,
              {}
            );

            // If another plugin handled it, return the result
            if (result !== resolvedDescriptor) {
              return result;
            }
          }

          // No plugin handled it - return as is
          return resolvedDescriptor;
        }

        return resolvedDescriptor;
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
