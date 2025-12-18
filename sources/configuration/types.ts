/**
 * Rule for catalog protocol usage validation
 * - 'always': Must use catalog: protocol if package is in catalogs
 * - 'optional': No validation
 * - 'restrict': Must NOT use catalog: protocol
 */
export type CatalogProtocolUsageRule = "always" | "optional" | "restrict";

/**
 * Validation rules that can be applied to workspaces
 */
export interface ValidationRules {
  catalog_protocol_usage?: CatalogProtocolUsageRule;
}

/**
 * A validation rule entry with workspace patterns and rules
 */
export interface ValidationRule {
  workspaces: string[];
  rules: ValidationRules;
}

/**
 * Validation configuration - array of rules matched in order (first match wins)
 */
export type ValidationConfig = ValidationRule[];

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
}

/**
 * catalogs.yml file structure
 */
export interface CatalogsConfiguration {
  options?: CatalogsOptions;
  validation?: ValidationConfig;
  list: {
    [alias: string]: {
      [packageName: string]: string;
    };
  };
}
