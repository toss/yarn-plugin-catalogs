export * from "./types";
export * from "./errors";
export * from "./reader";

// Create a singleton instance of our configuration reader
import { CatalogConfigurationReader } from "./reader";
export const configReader = new CatalogConfigurationReader();
