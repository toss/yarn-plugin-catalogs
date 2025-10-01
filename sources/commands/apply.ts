import { BaseCommand } from "@yarnpkg/cli";
import { Configuration, Project } from "@yarnpkg/core";
import { xfs, ppath, type PortablePath } from "@yarnpkg/fslib";
import { parseSyml, stringifySyml } from "@yarnpkg/parsers";
import { Command, Option } from "clipanion";
import type { CatalogsYmlStructure } from "../types";
import { resolveAllGroups } from "../utils/inheritance";

export class ApplyCommand extends BaseCommand {
  static paths = [["catalogs", "apply"]];

  dryRun = Option.Boolean("--dry-run", false, {
    description: "Show what would be applied without writing",
  });

  static usage = Command.Usage({
    description: "Apply catalog definitions from catalogs.yml to .yarnrc.yml",
    details: `
      This command reads catalog definitions from catalogs.yml (with inheritance support)
      and writes them to .yarnrc.yml, completely replacing existing catalog configurations.

      Inheritance is supported using the / delimiter (e.g., stable/canary inherits from stable).
      Child groups override parent package versions.
    `,
    examples: [
      ["Apply catalogs from catalogs.yml", "yarn catalogs apply"],
      [
        "Preview changes without applying",
        "yarn catalogs apply --dry-run",
      ],
    ],
  });

  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins,
    );
    const { project } = await Project.find(configuration, this.context.cwd);

    const catalogsYmlPath = ppath.join(
      project.cwd,
      "catalogs.yml" as PortablePath,
    );

    if (!(await xfs.existsPromise(catalogsYmlPath))) {
      this.context.stdout.write(
        "Error: catalogs.yml not found in project root\n",
      );
      return 1;
    }

    const catalogsYmlContent = await xfs.readFilePromise(
      catalogsYmlPath,
      "utf8",
    );
    const catalogsYml: CatalogsYmlStructure = parseSyml(catalogsYmlContent);

    if (!catalogsYml.list) {
      this.context.stdout.write(
        'Error: catalogs.yml must have a "list" field\n',
      );
      return 1;
    }

    const { root, ...namedGroups } = catalogsYml.list;

    // Filter out undefined values and root
    const catalogsToResolve: Record<string, Record<string, string>> = {};
    for (const [groupName, packages] of Object.entries(namedGroups)) {
      if (packages) {
        catalogsToResolve[groupName] = packages;
      }
    }

    let resolvedCatalogs: Record<string, Record<string, string>> = {};
    try {
      resolvedCatalogs = resolveAllGroups(catalogsToResolve);
    } catch (error) {
      this.context.stdout.write(
        `Error: Failed to resolve inheritance: ${(error as Error).message}\n`,
      );
      return 1;
    }

    const yarnrcPath = ppath.join(
      project.cwd,
      ".yarnrc.yml" as PortablePath,
    );
    let yarnrcContent: Record<string, unknown> = {};

    if (await xfs.existsPromise(yarnrcPath)) {
      const content = await xfs.readFilePromise(yarnrcPath, "utf8");
      yarnrcContent = parseSyml(content) || {};
    }

    if (root && Object.keys(root).length > 0) {
      yarnrcContent.catalog = root;
    } else {
      delete yarnrcContent.catalog;
    }

    if (Object.keys(resolvedCatalogs).length > 0) {
      yarnrcContent.catalogs = resolvedCatalogs;
    } else {
      delete yarnrcContent.catalogs;
    }

    // Dry-run
    if (this.dryRun) {
      this.context.stdout.write(stringifySyml(yarnrcContent));
      return 0;
    }

    await xfs.writeFilePromise(yarnrcPath, stringifySyml(yarnrcContent));

    const parts: string[] = [];
    if (root && Object.keys(root).length > 0) {
      parts.push("1 root catalog");
    }
    const namedCount = Object.keys(resolvedCatalogs).length;
    if (namedCount > 0) {
      parts.push(`${namedCount} named catalog group${namedCount > 1 ? "s" : ""}`);
    }

    if (parts.length === 0) {
      this.context.stdout.write("No catalogs to apply\n");
    } else {
      this.context.stdout.write(`✓ Applied ${parts.join(" and ")} to .yarnrc.yml\n`);
    }

    return 0;
  }
}
