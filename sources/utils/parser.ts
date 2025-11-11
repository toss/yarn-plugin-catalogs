import { ROOT_ALIAS_GROUP } from "../constants";
import type { CatalogsYml } from "../types";

/**
 * Validate catalogs.yml structure
 */
export function isValidCatalogsYml(config: unknown): config is CatalogsYml {
  if (!config || typeof config !== "object") {
    return false;
  }

  const cfg = config as Record<string, unknown>;

  if (!("list" in cfg)) {
    return false;
  }

  if (!cfg.list || typeof cfg.list !== "object") {
    return false;
  }

  for (const group of Object.values(cfg.list as Record<string, unknown>)) {
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
    const options = cfg.options;
    if (!options || typeof options !== "object") {
      return false;
    }

    const opts = options as Record<string, unknown>;

    if (opts.default) {
      if (Array.isArray(opts.default)) {
        if (
          opts.default.length === 0 ||
          !opts.default.every((item) => typeof item === "string")
        ) {
          return false;
        }
      } else if (
        typeof opts.default !== "string" ||
        opts.default !== "max"
      ) {
        return false;
      }
    }

    if (opts.ignoredWorkspaces) {
      if (
        !Array.isArray(opts.ignoredWorkspaces) ||
        opts.ignoredWorkspaces.length === 0 ||
        !opts.ignoredWorkspaces.every((item) => typeof item === "string")
      ) {
        return false;
      }
    }

    if (opts.validation) {
      const validLevels = ["warn", "strict", "off"];
      const validation = opts.validation;

      if (typeof validation === "string") {
        if (!validLevels.includes(validation)) {
          return false;
        }
      } else if (typeof validation === "object" && validation !== null) {
        if (
          !Object.values(validation).every(
            (level) =>
              typeof level === "string" && validLevels.includes(level),
          )
        ) {
          return false;
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
 * Ensures all parent groups exist in the inheritance chain
 */
export function validateInheritanceStructure(
  config: CatalogsYml,
  getInheritanceChain: (groupName: string) => string[],
): boolean {
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

export function isValidCatalog(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || value instanceof Map) {
    return false;
  }
  return Object.values(value).every((v) => typeof v === "string");
}

export function isValidCatalogs(
  value: unknown,
): value is Record<string, Record<string, string>> {
  if (!value || typeof value !== "object" || value instanceof Map) {
    return false;
  }
  return Object.values(value).every((catalog) => isValidCatalog(catalog));
}
