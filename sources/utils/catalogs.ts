import type { Project } from "@yarnpkg/core";
import { type Filename, type PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { parseSyml, stringifySyml } from "@yarnpkg/parsers";
import { ROOT_ALIAS_GROUP } from "../constants";
import { CatalogConfigurationError } from "../errors";
import type { CatalogsYml } from "../types";
import { getInheritanceChain } from "./functions";

const CATALOGS_YML_FILENAME = `catalogs.yml` as Filename;

/**
 * Read catalogs.yml file from project root
 */
export async function readCatalogsYml(
  project: Project,
): Promise<CatalogsYml | null> {
  const catalogsYmlPath = ppath.join(
    project.cwd,
    CATALOGS_YML_FILENAME as PortablePath,
  );

  if (!(await xfs.existsPromise(catalogsYmlPath))) {
    return null;
  }

  const content = await xfs.readFilePromise(catalogsYmlPath, "utf8");
  const parsed = parseSyml(content) as CatalogsYml;

  // Validate structure
  if (!isValidCatalogsYml(parsed)) {
    throw new CatalogConfigurationError(
      "Invalid catalogs.yml format. Expected structure: { options?: {...}, list: { [alias: string]: { [packageName: string]: string } } }",
      CatalogConfigurationError.INVALID_FORMAT,
    );
  }

  // Validate inheritance structure
  if (!validateInheritanceStructure(parsed)) {
    throw new CatalogConfigurationError(
      "Invalid inheritance structure in catalogs.yml. Parent groups must exist in the inheritance chain.",
      CatalogConfigurationError.INVALID_ALIAS,
    );
  }

  return parsed;
}

/**
 * Write catalogs to .yarnrc.yml in Yarn's native format
 * Only updates catalog and catalogs fields, preserves other configuration
 */
export async function writeCatalogsToYarnrc(
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

  // Read existing .yarnrc.yml
  let existingConfig: Record<string, unknown> = {};
  if (await xfs.existsPromise(yarnrcPath)) {
    const content = await xfs.readFilePromise(yarnrcPath, "utf8");
    existingConfig = (parseSyml(content) as Record<string, unknown>) || {};
  }

  // Update only catalog fields
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

  // Write back to .yarnrc.yml
  const newContent = stringifySyml(existingConfig);
  await xfs.writeFilePromise(yarnrcPath, newContent);
}

/**
 * Resolve inheritance for a single catalog group
 */
export function resolveInheritedCatalog(
  groupName: string,
  allGroups: CatalogsYml["list"],
): Record<string, string> {
  const chain = getInheritanceChain(groupName);
  const resolved: Record<string, string> = {};

  // Start from parent and override with child values
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
 * Resolve all catalogs with inheritance
 */
export function resolveAllCatalogs(catalogsYml: CatalogsYml): {
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
      result.named[groupName] = resolveInheritedCatalog(
        groupName,
        catalogsYml.list,
      );
    }
  }

  return result;
}

/**
 * Validate catalogs.yml structure
 */
function isValidCatalogsYml(config: unknown): config is CatalogsYml {
  if (!config || typeof config !== "object") {
    return false;
  }

  const cfg = config as Record<string, unknown>;

  // list is required
  if (!("list" in cfg) || !cfg.list || typeof cfg.list !== "object") {
    return false;
  }

  // Validate list structure
  const list = cfg.list as Record<string, unknown>;
  for (const [_, group] of Object.entries(list)) {
    if (!group || typeof group !== "object") {
      return false;
    }
    for (const version of Object.values(group as Record<string, unknown>)) {
      if (typeof version !== "string") {
        return false;
      }
    }
  }

  // Validate options if present
  if ("options" in cfg && cfg.options) {
    if (typeof cfg.options !== "object") {
      return false;
    }

    const options = cfg.options as Record<string, unknown>;

    // Validate default
    if ("default" in options && options.default) {
      if (Array.isArray(options.default)) {
        if (options.default.length === 0) {
          return false;
        }
        for (const item of options.default) {
          if (typeof item !== "string") {
            return false;
          }
        }
      } else if (typeof options.default !== "string") {
        return false;
      } else if (options.default !== "max") {
        return false;
      }
    }

    // Validate ignoredWorkspaces
    if ("ignoredWorkspaces" in options && options.ignoredWorkspaces) {
      if (!Array.isArray(options.ignoredWorkspaces)) {
        return false;
      }
      if (options.ignoredWorkspaces.length === 0) {
        return false;
      }
      for (const item of options.ignoredWorkspaces) {
        if (typeof item !== "string") {
          return false;
        }
      }
    }

    // Validate validation
    if ("validation" in options && options.validation) {
      const validation = options.validation;
      if (typeof validation === "string") {
        if (!["warn", "strict", "off"].includes(validation)) {
          return false;
        }
      } else if (typeof validation === "object" && validation !== null) {
        for (const [_, level] of Object.entries(validation)) {
          if (
            typeof level !== "string" ||
            !["warn", "strict", "off"].includes(level)
          ) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validate inheritance structure
 */
function validateInheritanceStructure(config: CatalogsYml): boolean {
  const groups = Object.keys(config.list);

  for (const group of groups) {
    if (group.includes("/")) {
      const chain = getInheritanceChain(group);
      for (let i = 0; i < chain.length - 1; i++) {
        const parentGroup = chain[i];
        if (!groups.includes(parentGroup) && parentGroup !== ROOT_ALIAS_GROUP) {
          return false;
        }
      }
    }
  }

  return true;
}
