declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    catalogs?: CatalogsConfiguration;
  }
}

export type ValidationLevel = "warn" | "strict" | "off";
export type ValidationConfig =
  | ValidationLevel
  | { [groupName: string]: ValidationLevel };

/**
 * Configuration structure for .yarnrc.yml#catalogs
 */
export interface CatalogsConfiguration {
  options?: {
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
  };
  list?: {
    [alias: string]:
      | {
          [packageName: string]: string;
        }
      | string;
  };
}
