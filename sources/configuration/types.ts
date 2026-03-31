/**
 * Rule levels for catalog protocol usage validation
 * - 'strict': MUST use catalog protocol.
 * - 'warn': SHOULD use catalog protocol. Print warnings if not.
 * - 'optional': CAN use catalog protocol. No errors/warnings.
 * - 'restrict': MUST NOT use catalog protocol.
 */
type CatalogProtocolUsageLevel = "strict" | "warn" | "optional" | "restrict";

/**
 * Rule for catalog protocol usage validation.
 * Can be a simple string level or an object with level and allow_protocols.
 */
export type CatalogProtocolUsageRule =
  | CatalogProtocolUsageLevel
  | { level: Extract<CatalogProtocolUsageLevel, "strict" | "warn">; allow_protocols?: string[] }
  | { level: Exclude<CatalogProtocolUsageLevel, Extract<CatalogProtocolUsageLevel, "strict" | "warn">> };

export interface ValidationRules {
  catalog_protocol_usage?: CatalogProtocolUsageRule;
}

export interface ValidationRule {
  workspaces: string[];
  rules: ValidationRules;
}

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
