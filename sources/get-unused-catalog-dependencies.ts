import { Descriptor, Workspace } from "@yarnpkg/core";
import { structUtils } from "@yarnpkg/core";
import { getCatalogProtocolUsability } from "./get-catalog-protocol-usability";
import { ValidationLevel } from "./types";

export async function getUnusedCatalogDependencies(
  workspace: Workspace,
): Promise<
  Array<{
    descriptor: Descriptor;
    validationLevel: Omit<ValidationLevel, "off">;
    applicableGroups: string[];
  }>
> {
  const dependencyDescriptors = [
    ...Object.entries<string>(workspace.manifest.raw["dependencies"] ?? {}),
    ...Object.entries<string>(workspace.manifest.raw["devDependencies"] ?? {}),
  ].map(([stringifiedIdent, version]) => {
    const ident = structUtils.parseIdent(stringifiedIdent);
    return structUtils.makeDescriptor(ident, version);
  });

  const results = [];

  for (const descriptor of dependencyDescriptors) {
    const validationInfo = await getCatalogProtocolUsability(
      workspace,
      descriptor,
    );

    // Only include packages that have validation enabled (not 'off')
    if (validationInfo && validationInfo.validationLevel !== "off") {
      results.push({
        descriptor,
        validationLevel: validationInfo.validationLevel,
        applicableGroups: validationInfo.applicableGroups,
      });
    }
  }

  return results;
}
