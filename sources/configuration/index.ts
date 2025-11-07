export * from "./types";
export * from "./errors";

// Create a singleton instance of our configuration reader
import { CatalogConfigurationReader } from "./reader";
export const configReader = new CatalogConfigurationReader();
