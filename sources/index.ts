import {
  type Descriptor,
  type Hooks,
  MessageName,
  type Plugin,
  type Workspace,
  structUtils,
} from "@yarnpkg/core";
import type { Hooks as EssentialHooks } from "@yarnpkg/plugin-essentials";
import chalk from "chalk";
import { ApplyCommand } from "./commands/apply";
import { fallbackDefaultAliasGroup } from "./utils/default";
import { validateWorkspace } from "./utils/validation";

const plugin: Plugin<Hooks & EssentialHooks> = {
  commands: [ApplyCommand],
  hooks: {
    validateWorkspace: async (workspace: Workspace, report) => {
      const result = await validateWorkspace(workspace);

      // Report catalog protocol violations
      if (result.catalogProtocolViolations.length > 0) {
        const strictViolations = result.catalogProtocolViolations.filter(
          (dep) => dep.validationLevel === "strict",
        );
        const warnViolations = result.catalogProtocolViolations.filter(
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

      // Report if ignored workspace uses catalog protocol
      if (result.ignoredWorkspaceWithCatalogProtocol) {
        report.reportError(
          MessageName.INVALID_MANIFEST,
          "Workspace is ignored from the catalogs, but it has dependencies with the catalog protocol. Consider removing the protocol.",
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
