import { Workspace, Descriptor } from "@yarnpkg/core";
import { configReader } from "./configuration";
import { CATALOG_PROTOCOL } from "./constants";

export async function getValidationInfoForNonCatalogDependency(
  workspace: Workspace,
  descriptor: Descriptor,
): Promise<{
  validationLevel: "warn" | "strict" | "off";
  applicableGroups: string[];
} | null> {
  // Skip if already using catalog protocol
  if (descriptor.range.startsWith(CATALOG_PROTOCOL)) {
    return null;
  }

  // Skip if workspace is ignored
  if (await configReader.shouldIgnoreWorkspace(workspace)) {
    return null;
  }

  // Find all groups that can access this package
  const accessibleGroups = (
    await configReader.findDependency(workspace.project, descriptor)
  ).map(({ groupName }) => groupName);

  // Return null if no applicable groups found
  if (accessibleGroups.length === 0) {
    return null;
  }

  // Get validation level for the package
  const validationLevel = await configReader.getValidationLevelForPackage(
    workspace,
    descriptor,
  );

  return {
    validationLevel,
    applicableGroups: accessibleGroups,
  };
}
