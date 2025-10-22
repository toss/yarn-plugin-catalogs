/**
 * Inheritance resolution utilities for catalog groups
 * Supports hierarchical inheritance using / delimiter (e.g., stable/canary/next)
 */
export class InheritanceResolver {
  /**
   * Get the inheritance chain for a group name
   * Example: stable/canary/next -> [stable, stable/canary, stable/canary/next]
   */
  getInheritanceChain(groupName: string): string[] {
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
   */
  resolveInheritance(
    groupName: string,
    catalogsList: Record<string, Record<string, string>>,
  ): Record<string, string> {
    // Get inheritance chain from parent to child
    const chain = this.getInheritanceChain(groupName);

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
   */
  resolveAllGroups(
    catalogsList: Record<string, Record<string, string>>,
  ): Record<string, Record<string, string>> {
    const resolved: Record<string, Record<string, string>> = {};

    for (const groupName of Object.keys(catalogsList)) {
      resolved[groupName] = this.resolveInheritance(groupName, catalogsList);
    }

    return resolved;
  }
}
