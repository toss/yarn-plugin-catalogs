import type { Project, Workspace } from "@yarnpkg/core";
import { structUtils } from "@yarnpkg/core";
import { type Filename, type PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { parseSyml, stringifySyml } from "@yarnpkg/parsers";
import { isMatch } from "picomatch";
import { ROOT_ALIAS_GROUP } from "../constants";
import { CatalogConfigurationError } from "../errors";
import type { CatalogsYml } from "../types";
import {
  isValidCatalog,
  isValidCatalogs,
  isValidCatalogsYml,
  validateInheritanceStructure,
} from "./parser";

const CATALOGS_YML_FILENAME = `catalogs.yml` as Filename;

/**
 * Read and manage catalogs.yml configuration
 * This is the core of the plugin - catalogs.yml is the source of truth
 */
export class CatalogsConfigurationReader {
  private cache: Map<string, CatalogsYml | null> = new Map();

  /**
   * Read catalogs.yml file from project root
   */
  async read(project: Project): Promise<CatalogsYml | null> {
    const cacheKey = String(project.cwd);
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const catalogsYmlPath = ppath.join(
      project.cwd,
      CATALOGS_YML_FILENAME as PortablePath,
    );

    if (!(await xfs.existsPromise(catalogsYmlPath))) {
      this.cache.set(cacheKey, null);
      return null;
    }

    const content = await xfs.readFilePromise(catalogsYmlPath, "utf8");
    const parsed: unknown = parseSyml(content);

    if (!isValidCatalogsYml(parsed)) {
      throw new CatalogConfigurationError(
        "Invalid catalogs.yml format. Expected structure: { options?: {...}, list: { [alias: string]: { [packageName: string]: string } } }",
        CatalogConfigurationError.INVALID_FORMAT,
      );
    }

    if (
      !validateInheritanceStructure(parsed, this.getInheritanceChain.bind(this))
    ) {
      throw new CatalogConfigurationError(
        "Invalid inheritance structure in catalogs.yml. Parent groups must exist in the inheritance chain.",
        CatalogConfigurationError.INVALID_ALIAS,
      );
    }

    this.cache.set(cacheKey, parsed);
    return parsed;
  }

  /**
   * Get options from catalogs.yml
   */
  async getOptions(project: Project): Promise<CatalogsYml["options"]> {
    const catalogsYml = await this.read(project);
    return catalogsYml?.options;
  }

  /**
   * Get applied catalogs from .yarnrc.yml (what Yarn currently uses)
   * This reads from .yarnrc.yml to see what's actually been applied
   */
  async getAppliedCatalogs(
    project: Project,
  ): Promise<Record<string, Record<string, string>>> {
    const yarnrcCatalog = project.configuration.get("catalog");
    const yarnrcCatalogs = project.configuration.get("catalogs");

    const catalogs: Record<string, Record<string, string>> = {};

    // Add root catalog if exists
    if (yarnrcCatalog && typeof yarnrcCatalog === "object") {
      if (yarnrcCatalog instanceof Map) {
        catalogs[ROOT_ALIAS_GROUP] = Object.fromEntries(
          yarnrcCatalog.entries(),
        );
      } else if (isValidCatalog(yarnrcCatalog)) {
        catalogs[ROOT_ALIAS_GROUP] = yarnrcCatalog;
      }
    }

    // Add named catalogs if exists
    if (yarnrcCatalogs && typeof yarnrcCatalogs === "object") {
      if (yarnrcCatalogs instanceof Map) {
        for (const [groupName, group] of yarnrcCatalogs.entries()) {
          if (group instanceof Map) {
            catalogs[groupName] = Object.fromEntries(group.entries());
          } else if (isValidCatalog(group)) {
            catalogs[groupName] = group;
          }
        }
      } else if (isValidCatalogs(yarnrcCatalogs)) {
        Object.assign(catalogs, yarnrcCatalogs);
      }
    }

    return catalogs;
  }

  /**
   * Check if a workspace is ignored based on catalogs.yml configuration
   */
  async shouldIgnoreWorkspace(workspace: Workspace): Promise<boolean> {
    if (!workspace.manifest.name) return false;

    const catalogsYml = await this.read(workspace.project);

    if (catalogsYml?.options?.ignoredWorkspaces) {
      return isMatch(
        structUtils.stringifyIdent(workspace.manifest.name),
        catalogsYml.options.ignoredWorkspaces,
      );
    }

    return false;
  }

  /**
   * Write catalogs to .yarnrc.yml in Yarn's native format
   * This applies catalogs.yml to .yarnrc.yml
   */
  async writeToYarnrc(
    project: Project,
    catalogs: {
      root?: Record<string, string>;
      named: Record<string, Record<string, string>>;
    },
  ): Promise<void> {
    const yarnrcPath = ppath.join(
      project.cwd,
      ".yarnrc.yml" as Filename as PortablePath,
    );

    let existingConfig: Record<string, unknown> = {};
    if (await xfs.existsPromise(yarnrcPath)) {
      const content = await xfs.readFilePromise(yarnrcPath, "utf8");
      existingConfig = (parseSyml(content) as Record<string, unknown>) || {};
    }

    if (catalogs.root && Object.keys(catalogs.root).length > 0) {
      existingConfig.catalog = catalogs.root;
    } else {
      delete existingConfig.catalog;
    }

    if (Object.keys(catalogs.named).length > 0) {
      existingConfig.catalogs = catalogs.named;
    } else {
      delete existingConfig.catalogs;
    }

    const newContent = stringifySyml(existingConfig);
    await xfs.writeFilePromise(yarnrcPath, newContent);
  }

  /**
   * Resolve all catalogs with inheritance
   */
  resolveAllCatalogs(catalogsYml: CatalogsYml): {
    root?: Record<string, string>;
    named: Record<string, Record<string, string>>;
  } {
    const result: {
      root?: Record<string, string>;
      named: Record<string, Record<string, string>>;
    } = {
      named: {},
    };

    for (const [groupName, group] of Object.entries(catalogsYml.list)) {
      if (groupName === ROOT_ALIAS_GROUP) {
        result.root = { ...group };
      } else {
        result.named[groupName] = this.resolveInheritedCatalog(
          groupName,
          catalogsYml.list,
        );
      }
    }

    return result;
  }

  /**
   * Resolve inheritance for a single catalog group
   */
  resolveInheritedCatalog(
    groupName: string,
    allGroups: CatalogsYml["list"],
  ): Record<string, string> {
    const chain = this.getInheritanceChain(groupName);
    const resolved: Record<string, string> = {};

    for (const ancestor of chain) {
      const group = allGroups[ancestor];
      if (!group) {
        throw new CatalogConfigurationError(
          `Parent group "${ancestor}" not found in inheritance chain for "${groupName}"`,
          CatalogConfigurationError.INVALID_ALIAS,
        );
      }
      Object.assign(resolved, group);
    }

    return resolved;
  }

  /**
   * Get inheritance chain for a group name
   * e.g., "frontend/react" => ["frontend", "frontend/react"]
   */
  getInheritanceChain(groupName: string): string[] {
    const parts = groupName.split("/");
    const chain: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      chain.push(parts.slice(0, i + 1).join("/"));
    }

    return chain;
  }

  /**
   * Clear the cache for a specific project
   */
  clearCache(project: Project): void {
    this.cache.delete(String(project.cwd));
  }
}

export const catalogsConfigReader = new CatalogsConfigurationReader();
