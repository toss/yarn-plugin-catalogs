/**
 * Parse inheritance chain from group name
 * e.g., "stable/canary/next" to ["stable", "stable/canary", "stable/canary/next"]
 */
export function getInheritanceChain(groupName: string): string[] {
  const parts = groupName.split("/");
  const chain: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    chain.push(parts.slice(0, i + 1).join("/"));
  }

  return chain;
}
