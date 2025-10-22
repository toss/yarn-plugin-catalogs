import {
  type Plugin,
  type Descriptor,
  type Hooks,
  type Workspace,
  MessageName,
} from "@yarnpkg/core";
import type { Hooks as EssentialHooks } from "@yarnpkg/plugin-essentials";
import chalk from "chalk";
import { CatalogConfigurationReader } from "./utils/configuration";
import { Validator, type PackageViolation } from "./utils/validation";
import { DefaultAliasResolver } from "./utils/default";
import { ApplyCommand } from "./commands/apply";

const configReader = new CatalogConfigurationReader();
const validationService = new Validator(configReader);
const defaultAliasService = new DefaultAliasResolver(
  configReader,
  validationService,
);

const plugin: Plugin<Hooks & EssentialHooks> = {
  commands: [ApplyCommand],
  hooks: {
    validateWorkspace: async (workspace: Workspace, report) => {
      const result = await validationService.validateWorkspace(workspace);

      if (result.violations.length > 0) {
        const strictViolations = result.violations.filter(
          (v) => v.validationLevel === "strict",
        );

        const warnViolations = result.violations.filter(
          (v) => v.validationLevel === "warn",
        );

        const createMessage = (violations: PackageViolation[]) => {
          const packageList = violations
            .map((v) => chalk.yellow(v.packageName))
            .join(", ");
          return `The following dependencies are listed in the catalogs but not using the catalog protocol: ${packageList}. Consider using the catalog protocol instead.`;
        };

        if (strictViolations.length > 0) {
          report.reportError(
            MessageName.INVALID_MANIFEST,
            createMessage(strictViolations),
          );
        }

        if (warnViolations.length > 0) {
          report.reportWarning(
            MessageName.INVALID_MANIFEST,
            createMessage(warnViolations),
          );
        }
      }

      // Report if ignored workspace has catalog protocol
      if (result.hasCatalogProtocolWhenIgnored) {
        report.reportError(
          MessageName.INVALID_MANIFEST,
          `Workspace is ignored from the catalogs, but it has dependencies with the catalog protocol. Consider removing the protocol.`,
        );
      }
    },
    afterWorkspaceDependencyAddition: async (
      workspace: Workspace,
      target: string,
      dependency: Descriptor,
    ) => {
      await defaultAliasService.applyDefaultAlias(
        workspace,
        target,
        dependency,
      );
    },
    afterWorkspaceDependencyReplacement: async (
      workspace: Workspace,
      target: string,
      _fromDescriptor: Descriptor,
      dependency: Descriptor,
    ) => {
      await defaultAliasService.applyDefaultAlias(
        workspace,
        target,
        dependency,
      );
    },
  },
};

export default plugin;
