type ValidationLevel = "warn" | "strict" | "off";
type ValidationConfig =
  | ValidationLevel
  | { [groupName: string]: ValidationLevel };

export interface CatalogsOptions {
  /**
   * The default alias group to be used when no group is specified when adding a dependency
   * - if list of alias groups, it will be used in order
   * - if 'max', the most frequently used alias group will be used
   */
  default?: string[] | "max";
  /**
   * List of workspaces to ignore
   */
  ignoredWorkspaces?: string[];
  /**
   * Validation level for catalog usage
   * - 'warn': Show warnings when catalog versions are not used (default)
   * - 'strict': Throw errors when catalog versions are not used
   * - 'off': Disable validation
   * Can also be an object with group-specific settings: { [groupName]: 'warn' | 'strict' | 'off' }
   */
  validation?: ValidationConfig;
}

/**
 * Structure of catalogs.yml file
 */
export interface CatalogsYmlStructure {
  /**
   * Plugin-specific options
   */
  options?: CatalogsOptions;
  /**
   * Catalog definitions with inheritance support
   * - root: Root catalog (maps to catalog: in .yarnrc.yml)
   * - other groups: Named catalogs (maps to catalogs: in .yarnrc.yml)
   * - Groups can inherit using / delimiter (e.g., stable/canary inherits from stable)
   */
  list?: {
    root?: { [packageName: string]: string };
    [groupName: string]: { [packageName: string]: string } | undefined;
  };
}
