import type { ValidationLevel } from "../types";

type ValidationConfig =
  | ValidationLevel
  | { [groupName: string]: ValidationLevel };

/**
 * Options for catalog management (plugin-specific features)
 */
interface CatalogsOptions {
  /**
   * The default alias group to be used when no group is specified when adding a dependency
   * - if list of alias groups, it will be used in order
   * - if 'max', the most frequently used alias group will be used
   */
  default?: string[] | "max";
  /**
   * List of workspaces to include (opt-in)
   * If specified, only matching workspaces will be processed
   */
  includedWorkspaces?: string[];
  /**
   * List of workspaces to ignore (opt-out)
   * Workspaces matching these patterns will be excluded from catalog processing
   */
  ignoredWorkspaces?: string[];
  /**
   * Validation level for catalog usage
   * - 'warn': Show warnings when catalog versions are not used (default)
   * - 'strict': Throw errors when catalog versions are not used
   * - 'off': Disable validation
   * Can also be an object with group-specific settings
   */
  validation?: ValidationConfig;
}

/**
 * catalogs.yml file structure
 */
export interface CatalogsConfiguration {
  options?: CatalogsOptions;
  list: {
    [alias: string]: {
      [packageName: string]: string;
    };
  };
}
