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
import { validateWorkspaceDependencies } from "./utils/validation";

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
      const violations = await validateWorkspaceDependencies(workspace);

      if (violations.length === 0) {
        return;
      }

      for (const violation of violations) {
        report.reportError(
          MessageName.INVALID_MANIFEST,
          `${chalk.yellow(structUtils.stringifyDescriptor(violation.descriptor))}: ${violation.message}`,
        );
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
