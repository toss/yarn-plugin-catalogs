/**
 * Inheritance resolution utilities for catalog groups
 * Supports hierarchical inheritance using / delimiter (e.g., stable/canary/next)
 */

/**
 * Get the inheritance chain for a group name
 * Example: stable/canary/next -> [stable, stable/canary, stable/canary/next]
 */
export function getInheritanceChain(groupName: string): string[] {
  const parts = groupName.split("/");
  const chain: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    chain.push(parts.slice(0, i + 1).join("/"));
  }

  return chain;
}

/**
 * Resolve inheritance for a catalog group
 * Returns the merged package definitions from all parent groups
 * Child groups override parent values
 *
 * @param groupName - The catalog group name (e.g., stable/canary/next)
 * @param catalogsList - All catalog definitions
 * @returns Resolved package definitions with inheritance applied
 * @throws Error if any parent group in the chain doesn't exist
 */
export function resolveInheritance(
  groupName: string,
  catalogsList: Record<string, Record<string, string>>,
): Record<string, string> {
  // Get inheritance chain from parent to child
  const chain = getInheritanceChain(groupName);

  // Validate all parents exist
  for (const parent of chain) {
    if (!catalogsList[parent]) {
      throw new Error(
        `Catalog group "${parent}" not found in inheritance chain for "${groupName}"`,
      );
    }
  }

  // Merge from parent to child (child overrides parent)
  const resolved: Record<string, string> = {};
  for (const group of chain) {
    Object.assign(resolved, catalogsList[group]);
  }

  return resolved;
}

/**
 * Resolve all catalog groups with inheritance
 * Processes all groups and returns a flattened map with inheritance resolved
 *
 * @param catalogsList - All catalog definitions (excluding root)
 * @returns Map of resolved catalog groups
 */
export function resolveAllGroups(
  catalogsList: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const resolved: Record<string, Record<string, string>> = {};

  for (const groupName of Object.keys(catalogsList)) {
    resolved[groupName] = resolveInheritance(groupName, catalogsList);
  }

  return resolved;
}
