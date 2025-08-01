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
import { Hooks as EssentialHooks } from "@yarnpkg/plugin-essentials";
import { Hooks as PackHooks } from "@yarnpkg/plugin-pack";
import chalk from "chalk";
import {
  CatalogConfigurationReader,
  CatalogConfigurationError,
  CatalogsConfiguration,
  CATALOG_PROTOCOL,
  ROOT_ALIAS_GROUP,
} from "./configuration";

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs?: CatalogsConfiguration;
  }
}

// Create a singleton instance of our configuration reader
const configReader = new CatalogConfigurationReader();

const plugin: Plugin<Hooks & EssentialHooks & PackHooks> = {
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
      const shouldIgnore = await configReader.shouldIgnoreWorkspace(workspace);

      // Check if any dependencies in manifest are in catalog but not using catalog protocol
      if (!shouldIgnore) {
        const violatedDependencies =
          await getCatalogDependenciesWithoutProtocol(workspace);

        if (violatedDependencies.length > 0) {
          const packageList = chalk.yellow(violatedDependencies.join(", "));

          const validationLevel =
            await configReader.getValidationLevel(workspace);
          const message = `The following dependencies are listed in the catalogs but not using the catalog protocol: ${packageList}. Consider using the catalog protocol instead.`;

          if (validationLevel === "strict") {
            report.reportError(MessageName.INVALID_MANIFEST, message);
          } else if (validationLevel === "warn") {
            report.reportWarning(MessageName.INVALID_MANIFEST, message);
          }
        }
      }

      // Check the workspace's raw manifest to find dependencies with the catalog protocol
      const hasCatalogProtocol = [
        ...Object.values(workspace.manifest.raw["dependencies"] || {}),
        ...Object.values(workspace.manifest.raw["devDependencies"] || {}),
      ].some((version) => (version as string).startsWith(CATALOG_PROTOCOL));

      if (shouldIgnore && hasCatalogProtocol) {
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
      // Check for catalog: in regular form or in patched form (for typescript)
      const isStandardCatalog = dependency.range.startsWith(CATALOG_PROTOCOL);
      const isPatchedCatalog =
        dependency.range.includes("catalog%3A") &&
        dependency.range.startsWith("patch:");

      // Skip if neither standard nor patched catalog protocol
      if (!isStandardCatalog && !isPatchedCatalog) {
        return dependency;
      }

      try {
        // Extract the alias from the range
        let catalogAlias = "";
        const originalRange = dependency.range;

        if (isStandardCatalog) {
          catalogAlias = dependency.range.slice(CATALOG_PROTOCOL.length);
        } else if (isPatchedCatalog) {
          const catalogMatch = dependency.range.match(/catalog%3A([^#&]*)/);
          if (catalogMatch) {
            catalogAlias = catalogMatch[1] || "";
          }
        }

        // Get the actual version from .yarnrc.yml
        const dependencyName = structUtils.stringifyIdent(dependency);
        const range = await configReader.getRange(
          project,
          catalogAlias,
          dependencyName,
        );

        // Create a new descriptor with the resolved version
        let resolvedDescriptor: Descriptor;
        if (isStandardCatalog) {
          resolvedDescriptor = structUtils.makeDescriptor(
            structUtils.makeIdent(dependency.scope, dependency.name),
            range,
          );
        } else {
          resolvedDescriptor = structUtils.makeDescriptor(
            structUtils.makeIdent(dependency.scope, dependency.name),
            originalRange.replace(/catalog%3A[^#&]*/, range),
          );
        }

        if (isPatchedCatalog) {
          return resolvedDescriptor;
        }

        const result = await project.configuration.reduceHook(
          (hooks) => hooks.reduceDependency,
          resolvedDescriptor,
          project,
          ...extraArgs,
        );

        if (result !== resolvedDescriptor) {
          return result;
        }

        return resolvedDescriptor;
      } catch (error) {
        if (error instanceof CatalogConfigurationError) {
          throw new Error(
            `Failed to resolve ${structUtils.stringifyDescriptor(
              dependency,
            )}: ${error.message}`,
          );
        }
        throw error;
      }
    },
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

async function getCatalogDependenciesWithoutProtocol(
  workspace: Workspace,
): Promise<string[]> {
  const config = await configReader.readConfiguration(workspace.project);

  // Get all package names from catalog configuration
  const catalogPackages = new Set<string>();
  if (config.list) {
    for (const [_, aliasConfig] of Object.entries(config.list)) {
      if (typeof aliasConfig === "object") {
        for (const packageName of Object.keys(aliasConfig)) {
          catalogPackages.add(packageName);
        }
      }
    }
  }

  // Check if any dependencies in manifest are in catalog but not using catalog protocol
  const dependencyEntries = [
    ...Object.entries(workspace.manifest.raw["dependencies"] || {}),
    ...Object.entries(workspace.manifest.raw["devDependencies"] || {}),
  ];

  const dependenciesWithoutProtocol: string[] = [];

  for (const [packageName, version] of dependencyEntries) {
    const versionString = version as string;

    // Skip if already using catalog protocol
    if (versionString.startsWith(CATALOG_PROTOCOL)) {
      continue;
    }

    // Check if package is in catalog
    if (catalogPackages.has(packageName)) {
      dependenciesWithoutProtocol.push(packageName);
    }
  }

  return dependenciesWithoutProtocol;
}

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
