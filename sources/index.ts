import {
  type Descriptor,
  type Hooks,
  MessageName,
  type Plugin,
  type Project,
  type Workspace,
  structUtils,
} from "@yarnpkg/core";
import type { Hooks as EssentialHooks } from "@yarnpkg/plugin-essentials";
import chalk from "chalk";
import {
  ApplyCommand,
  checkForChanges,
  readExistingYarnrc,
} from "./commands/apply";
import { configReader } from "./configuration";
import { fallbackDefaultAliasGroup } from "./utils/default";
import { validateWorkspaceCatalogUsability } from "./utils/validation";

const plugin: Plugin<Hooks & EssentialHooks> = {
  commands: [ApplyCommand],
  hooks: {
    validateProject: async (project: Project, report) => {
      const catalogsYml = await configReader.read(project);

      // Skip validation if no catalogs.yml exists
      if (!catalogsYml) {
        return;
      }

      const resolved = configReader.resolveAllCatalogs(catalogsYml);
      const existingConfig = await readExistingYarnrc(project);
      const hasChanges = checkForChanges(existingConfig, resolved);

      if (hasChanges) {
        report.reportError(
          MessageName.INVALID_MANIFEST,
          ".yarnrc.yml is out of date. Run 'yarn catalogs apply' to update it.",
        );
      }
    },
    validateWorkspace: async (workspace: Workspace, report) => {
      const catalogProtocolViolations = await validateWorkspaceCatalogUsability(workspace);

      // Report catalog protocol violations
      if (catalogProtocolViolations.length > 0) {
        const strictViolations = catalogProtocolViolations.filter(
          (dep) => dep.validationLevel === "strict",
        );
        const warnViolations = catalogProtocolViolations.filter(
          (dep) => dep.validationLevel === "warn",
        );

        const formatMessage = (
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
            formatMessage(strictViolations),
          );
        }

        if (warnViolations.length > 0) {
          report.reportWarning(
            MessageName.INVALID_MANIFEST,
            formatMessage(warnViolations),
          );
        }
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
  },
};

// Export the plugin factory
export default plugin;
