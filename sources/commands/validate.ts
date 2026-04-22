import { BaseCommand } from "@yarnpkg/cli";
import { Configuration, MessageName, Project, StreamReport } from "@yarnpkg/core";
import chalk from "chalk";
import { Command } from "clipanion";
import { configReader } from "../configuration";
import { validateWorkspaceDependencies } from "../utils/validation";
import { checkForChanges, readExistingYarnrc } from "./apply";

export class ValidateCommand extends BaseCommand {
  static paths = [["catalogs", "validate"]];

  static usage = Command.Usage({
    category: "Catalogs commands",
    description:
      "Validate workspace dependencies against catalog rules defined in catalogs.yml",
    details: `
      This command checks all workspaces against the validation rules defined in catalogs.yml.
      It reports errors and warnings for each workspace that has violations.

      Use this command in CI to enforce catalog protocol usage rules.
    `,
    examples: [["Validate all workspaces", "yarn catalogs validate"]],
  });

  async execute(): Promise<number> {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins,
    );
    const { project } = await Project.find(configuration, this.context.cwd);

    const report = await StreamReport.start(
      {
        configuration,
        stdout: this.context.stdout,
      },
      async (report) => {
        const catalogsYml = await configReader.read(project);

        if (!catalogsYml) {
          report.reportError(
            MessageName.UNNAMED,
            "No catalogs.yml file found in project root.",
          );
          return;
        }

        if (!catalogsYml.validation || catalogsYml.validation.length === 0) {
          report.reportInfo(
            MessageName.UNNAMED,
            "No validation rules configured in catalogs.yml.",
          );
          return;
        }

        const resolved = configReader.resolveAllCatalogs(catalogsYml);
        const existingConfig = await readExistingYarnrc(project);
        const hasChanges = checkForChanges(existingConfig, resolved);

        if (hasChanges) {
          report.reportError(
            MessageName.UNNAMED,
            ".yarnrc.yml is out of date. Run 'yarn catalogs apply' first.",
          );
          return;
        }

        for (const workspace of project.workspaces) {
          const violations = await validateWorkspaceDependencies(workspace);

          if (violations.length === 0) {
            continue;
          }

          const workspaceName =
            workspace.manifest.raw.name ?? workspace.relativeCwd;
          report.reportInfo(MessageName.UNNAMED, chalk.bold(workspaceName));

          for (const violation of violations) {
            if (violation.severity === "error") {
              report.reportError(
                MessageName.INVALID_MANIFEST,
                `  ${violation.message}`,
              );
            } else {
              report.reportWarning(
                MessageName.UNNAMED,
                `  ${violation.message}`,
              );
            }
          }
        }
      },
    );

    return report.exitCode();
  }
}
