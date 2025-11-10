import { BaseCommand } from "@yarnpkg/cli";
import { Configuration, Project, StreamReport } from "@yarnpkg/core";
import chalk from "chalk";
import { Command, Option } from "clipanion";
import {
  readCatalogsYml,
  resolveAllCatalogs,
  writeCatalogsToYarnrc,
} from "../utils/catalogs";
import { configReader } from "../utils/config";

export class ApplyCommand extends BaseCommand {
  static paths = [["catalogs", "apply"]];

  static usage = Command.Usage({
    category: "Catalogs commands",
    description: "Apply catalog definitions from catalogs.yml to .yarnrc.yml",
    details: `
      This command reads catalog definitions from catalogs.yml, resolves all inheritance,
      and writes them to .yarnrc.yml in Yarn's native catalog format.

      The catalogs.yml file should contain hierarchical catalog definitions with optional inheritance.
      After running this command, Yarn will use its native catalog resolution for dependencies.
    `,
    examples: [
      ["Apply catalogs to .yarnrc.yml", "yarn catalogs apply"],
      ["Preview changes without writing", "yarn catalogs apply --dry-run"],
    ],
  });

  dryRun = Option.Boolean("--dry-run", false, {
    description: "Preview changes without writing to .yarnrc.yml",
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
        // Read catalogs.yml
        const catalogsYml = await readCatalogsYml(project);

        if (!catalogsYml) {
          report.reportError(
            0,
            "No catalogs.yml file found in project root. Please create one to use this command.",
          );
          return;
        }

        // Resolve all catalogs with inheritance
        const resolved = resolveAllCatalogs(catalogsYml);

        // Count catalogs
        const rootCount = resolved.root ? 1 : 0;
        const namedCount = Object.keys(resolved.named).length;

        if (this.dryRun) {
          // Dry run: just display what would be written
          report.reportInfo(
            0,
            chalk.bold("Dry run mode - no files will be modified"),
          );
          report.reportSeparator();

          if (resolved.root) {
            report.reportInfo(0, chalk.bold("Root catalog:"));
            for (const [pkg, version] of Object.entries(resolved.root)) {
              report.reportInfo(0, `  ${chalk.cyan(pkg)}: ${version}`);
            }
            report.reportSeparator();
          }

          if (namedCount > 0) {
            report.reportInfo(0, chalk.bold("Named catalogs:"));
            for (const [groupName, group] of Object.entries(resolved.named)) {
              report.reportInfo(0, chalk.yellow(`  ${groupName}:`));
              for (const [pkg, version] of Object.entries(group)) {
                report.reportInfo(0, `    ${chalk.cyan(pkg)}: ${version}`);
              }
            }
            report.reportSeparator();
          }

          report.reportInfo(
            0,
            `Would apply ${rootCount > 0 ? "1 root catalog" : "no root catalog"}${rootCount > 0 && namedCount > 0 ? " and" : ""}${namedCount > 0 ? ` ${namedCount} named catalog group${namedCount > 1 ? "s" : ""}` : ""} to .yarnrc.yml`,
          );
        } else {
          // Actually write to .yarnrc.yml
          await writeCatalogsToYarnrc(project, resolved);

          // Clear the configuration cache so it reloads from .yarnrc.yml
          configReader.clearCache(project);

          report.reportInfo(
            0,
            chalk.green(
              `✓ Applied ${rootCount > 0 ? "1 root catalog" : "no root catalog"}${rootCount > 0 && namedCount > 0 ? " and" : ""}${namedCount > 0 ? ` ${namedCount} named catalog group${namedCount > 1 ? "s" : ""}` : ""} to .yarnrc.yml`,
            ),
          );
        }
      },
    );

    return report.exitCode();
  }
}
