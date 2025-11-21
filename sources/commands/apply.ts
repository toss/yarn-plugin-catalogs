import { BaseCommand } from "@yarnpkg/cli";
import { Configuration, Project, StreamReport } from "@yarnpkg/core";
import { type Filename, type PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { parseSyml, stringifySyml } from "@yarnpkg/parsers";
import chalk from "chalk";
import { Command, Option } from "clipanion";
import { configReader } from "../configuration";

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
      ["Check if .yarnrc.yml is up to date", "yarn catalogs apply --check"],
    ],
  });

  check = Option.Boolean("--check", false, {
    description:
      "Check if .yarnrc.yml is up to date and preview changes (fails if changes are needed)",
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
            0,
            "No catalogs.yml file found in project root. Please create one to use this command.",
          );
          return;
        }

        const resolved = configReader.resolveAllCatalogs(catalogsYml);
        const existingConfig = await readExistingYarnrc(project);
        const hasChanges = checkForChanges(existingConfig, resolved);

        if (!hasChanges) {
          this.reportNoChanges(report);
          return;
        }

        if (this.check) {
          this.reportCheckFailure(report, existingConfig, resolved);
        } else {
          await this.applyChanges(report, project, existingConfig, resolved);
        }
      },
    );

    return report.exitCode();
  }

  private reportNoChanges(report: StreamReport): void {
    const message = this.check
      ? chalk.green("✓ .yarnrc.yml is up to date")
      : "No changes to apply - .yarnrc.yml is already up to date";
    report.reportInfo(0, message);
  }

  private reportCheckFailure(
    report: StreamReport,
    existingConfig: Record<string, unknown>,
    resolved: {
      root?: Record<string, string>;
      named: Record<string, Record<string, string>>;
    },
  ): void {
    report.reportError(
      0,
      ".yarnrc.yml is out of date. Run 'yarn catalogs apply' to update it.",
    );

    showCatalogDiff(report, existingConfig, resolved);

    const summary = formatCatalogSummary(
      resolved.root ? 1 : 0,
      Object.keys(resolved.named).length,
    );
    report.reportInfo(0, `Would apply ${summary} to .yarnrc.yml`);
  }

  private async applyChanges(
    report: StreamReport,
    project: Project,
    existingConfig: Record<string, unknown>,
    resolved: {
      root?: Record<string, string>;
      named: Record<string, Record<string, string>>;
    },
  ): Promise<void> {
    showCatalogDiff(report, existingConfig, resolved);

    await configReader.writeToYarnrc(project, resolved);
    configReader.clearCache(project);

    const summary = formatCatalogSummary(
      resolved.root ? 1 : 0,
      Object.keys(resolved.named).length,
    );
    report.reportInfo(0, chalk.green(`✓ Applied ${summary} to .yarnrc.yml`));
  }
}

/**
 * Read existing .yarnrc.yml configuration
 */
export async function readExistingYarnrc(
  project: Project,
): Promise<Record<string, unknown>> {
  const yarnrcPath = ppath.join(
    project.cwd,
    ".yarnrc.yml" as Filename as PortablePath,
  );

  if (!(await xfs.existsPromise(yarnrcPath))) {
    return {};
  }

  const content = await xfs.readFilePromise(yarnrcPath, "utf8");
  return (parseSyml(content) as Record<string, unknown>) || {};
}

/**
 * Check if there are changes between existing and resolved catalogs
 */
export function checkForChanges(
  existingConfig: Record<string, unknown>,
  resolved: {
    root?: Record<string, string>;
    named: Record<string, Record<string, string>>;
  },
): boolean {
  const newConfig = { ...existingConfig };

  if (resolved.root && Object.keys(resolved.root).length > 0) {
    newConfig.catalog = resolved.root;
  } else {
    newConfig.catalog = undefined;
  }

  if (Object.keys(resolved.named).length > 0) {
    newConfig.catalogs = resolved.named;
  } else {
    newConfig.catalogs = undefined;
  }

  const oldContent = stringifySyml(existingConfig);
  const newContent = stringifySyml(newConfig);

  return oldContent !== newContent;
}

/**
 * Format catalog summary message
 */
function formatCatalogSummary(rootCount: number, namedCount: number): string {
  const parts: string[] = [];

  if (rootCount > 0) {
    parts.push("1 root catalog");
  }

  if (namedCount > 0) {
    parts.push(`${namedCount} named catalog group${namedCount > 1 ? "s" : ""}`);
  }

  if (parts.length === 0) {
    return "no catalogs";
  }

  return parts.join(" and ");
}

/**
 * Show diff for a single catalog group
 */
function showCatalogGroupDiff(
  report: StreamReport,
  groupName: string,
  oldCatalog: Record<string, string>,
  newCatalog: Record<string, string>,
): void {
  const allPackages = new Set([
    ...Object.keys(oldCatalog),
    ...Object.keys(newCatalog),
  ]);
  const hasChanges = Array.from(allPackages).some(
    (pkg) => oldCatalog[pkg] !== newCatalog[pkg],
  );

  if (!hasChanges) {
    return;
  }

  report.reportInfo(0, chalk.bold(`${groupName}:`));

  for (const pkg of Array.from(allPackages).sort()) {
    const oldVersion = oldCatalog[pkg];
    const newVersion = newCatalog[pkg];

    if (!oldVersion) {
      report.reportInfo(0, chalk.green(`  + ${pkg}: ${newVersion}`));
    } else if (!newVersion) {
      report.reportInfo(0, chalk.red(`  - ${pkg}: ${oldVersion}`));
    } else if (oldVersion !== newVersion) {
      report.reportInfo(0, chalk.red(`  - ${pkg}: ${oldVersion}`));
      report.reportInfo(0, chalk.green(`  + ${pkg}: ${newVersion}`));
    }
  }
}

/**
 * Show diff between current and new catalogs
 */
function showCatalogDiff(
  report: StreamReport,
  existingConfig: Record<string, unknown>,
  resolved: {
    root?: Record<string, string>;
    named: Record<string, Record<string, string>>;
  },
): void {
  const currentRoot = existingConfig.catalog as
    | Record<string, string>
    | undefined;
  const currentNamed = existingConfig.catalogs as
    | Record<string, Record<string, string>>
    | undefined;

  // Show diff for root catalog
  if (resolved.root || currentRoot) {
    showCatalogGroupDiff(
      report,
      "root catalog",
      currentRoot || {},
      resolved.root || {},
    );
  }

  // Show diff for named catalogs
  const allGroups = new Set([
    ...Object.keys(currentNamed || {}),
    ...Object.keys(resolved.named),
  ]);

  for (const groupName of Array.from(allGroups).sort()) {
    showCatalogGroupDiff(
      report,
      groupName,
      currentNamed?.[groupName] || {},
      resolved.named[groupName] || {},
    );
  }
}
