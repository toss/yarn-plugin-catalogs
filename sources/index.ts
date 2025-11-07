import {
  type Descriptor,
  type Hooks,
  Manifest,
  MessageName,
  type Plugin,
  type Project,
  SettingsType,
  structUtils,
  type Workspace,
} from "@yarnpkg/core";
import type { Hooks as EssentialHooks } from "@yarnpkg/plugin-essentials";
import type { Hooks as PackHooks } from "@yarnpkg/plugin-pack";
import chalk from "chalk";
import {
  CatalogConfigurationError,
  type CatalogsConfiguration,
  configReader,
} from "./configuration";
import { getUnusedCatalogDependencies } from "./get-unused-catalog-dependencies";
import { fallbackDefaultAliasGroup } from "./fallback-default-alias-group";
import { CATALOG_PROTOCOL } from "./constants";

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs?: CatalogsConfiguration;
  }
}

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
          await getUnusedCatalogDependencies(workspace);

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
              .map((dep) =>
                chalk.yellow(structUtils.stringifyDescriptor(dep.descriptor)),
              )
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
        ...Object.values<string>(workspace.manifest.raw.dependencies || {}),
        ...Object.values<string>(workspace.manifest.raw.devDependencies || {}),
      ].some((version) => version.startsWith(CATALOG_PROTOCOL));

      if (shouldIgnore && hasCatalogProtocol) {
        report.reportError(
          MessageName.INVALID_MANIFEST,
          "Workspace is ignored from the catalogs, but it has dependencies with the catalog protocol. Consider removing the protocol.",
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
    beforeWorkspacePacking: async (
      workspace: Workspace,
      rawManifest: Workspace["manifest"]["raw"],
    ) => {
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

// Export the plugin factory
export default plugin;
