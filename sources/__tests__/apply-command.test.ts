import { afterEach, describe, expect, it } from "vitest";
import { type TestWorkspace, createTestWorkspace } from "./utils";

describe("catalogs apply command", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should apply named catalogs to .yarnrc.yml", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
        beta: {
          react: "npm:19.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();
    expect(yarnrc.catalogs).toBeDefined();
    expect(yarnrc.catalogs.stable).toEqual({
      react: "npm:18.0.0",
      lodash: "npm:4.17.21",
    });
    expect(yarnrc.catalogs.beta).toEqual({
      react: "npm:19.0.0",
    });
  });

  it("should apply root catalog to .yarnrc.yml", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        root: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
      },
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();
    expect(yarnrc.catalog).toBeDefined();
    expect(yarnrc.catalog).toEqual({
      react: "npm:18.0.0",
      lodash: "npm:4.17.21",
    });
  });

  it("should apply both root and named catalogs", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        root: {
          react: "npm:18.0.0",
        },
        stable: {
          lodash: "npm:4.17.21",
        },
      },
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();
    expect(yarnrc.catalog).toEqual({
      react: "npm:18.0.0",
    });
    expect(yarnrc.catalogs.stable).toEqual({
      lodash: "npm:4.17.21",
    });
  });

  it("should resolve inheritance when applying", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
        "stable/canary": {
          react: "npm:19.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();
    expect(yarnrc.catalogs.stable).toEqual({
      react: "npm:18.0.0",
      lodash: "npm:4.17.21",
    });
    // stable/canary should have inherited lodash
    expect(yarnrc.catalogs["stable/canary"]).toEqual({
      react: "npm:19.0.0",
      lodash: "npm:4.17.21",
    });
  });

  it("should resolve multi-level inheritance", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        base: {
          react: "npm:17.0.0",
          lodash: "npm:4.0.0",
          next: "npm:12.0.0",
        },
        "base/stable": {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
        "base/stable/canary": {
          react: "npm:19.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();

    expect(yarnrc.catalogs.base).toEqual({
      react: "npm:17.0.0",
      lodash: "npm:4.0.0",
      next: "npm:12.0.0",
    });

    expect(yarnrc.catalogs["base/stable"]).toEqual({
      react: "npm:18.0.0",
      lodash: "npm:4.17.21",
      next: "npm:12.0.0", // inherited from base
    });

    expect(yarnrc.catalogs["base/stable/canary"]).toEqual({
      react: "npm:19.0.0",
      lodash: "npm:4.17.21", // inherited from base/stable
      next: "npm:12.0.0", // inherited from base
    });
  });

  it("should preserve existing .yarnrc.yml fields", async () => {
    workspace = await createTestWorkspace();

    // Write some custom config to .yarnrc.yml
    await workspace.writeYarnrc({
      nodeLinker: "node-modules",
      npmRegistryServer: "https://registry.npmjs.org",
    });

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();

    // Should preserve existing fields
    expect(yarnrc.nodeLinker).toBe("node-modules");
    expect(yarnrc.npmRegistryServer).toBe("https://registry.npmjs.org");

    // Should add catalogs
    expect(yarnrc.catalogs.stable).toEqual({
      react: "npm:18.0.0",
    });
  });

  it("should overwrite existing catalogs", async () => {
    workspace = await createTestWorkspace();

    // Write initial catalogs
    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // Update catalogs
    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:19.0.0",
          lodash: "npm:4.17.21",
        },
      },
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();
    expect(yarnrc.catalogs.stable).toEqual({
      react: "npm:19.0.0",
      lodash: "npm:4.17.21",
    });
  });

  it("should show success message", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
        beta: {
          react: "npm:19.0.0",
        },
      },
    });

    const { stdout } = await workspace.yarn.catalogs.apply();
    expect(stdout).toContain("Applied");
    expect(stdout).toContain("2 named catalog groups");
  });

  it("should handle check mode when changes are needed", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    // Check mode should fail when changes are needed
    await expect(workspace.yarn.catalogs.apply(true)).rejects.toThrow();
  });

  it("should handle check mode when up to date", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    // First apply the catalogs
    await workspace.yarn.catalogs.apply();

    // Then check - should pass without error
    await expect(workspace.yarn.catalogs.apply(true)).resolves.not.toThrow();
  });

  it("should fail when catalogs.yml does not exist", async () => {
    workspace = await createTestWorkspace();

    // Don't create catalogs.yml
    await expect(workspace.yarn.catalogs.apply()).rejects.toThrow();
  });

  it("should handle empty catalogs list", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {},
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();
    // Should not have catalog or catalogs fields
    expect(yarnrc.catalog).toBeUndefined();
    expect(yarnrc.catalogs).toBeUndefined();
  });

  it("should remove catalogs when list becomes empty", async () => {
    workspace = await createTestWorkspace();

    // First apply with some catalogs
    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // Then apply with empty list
    await workspace.writeCatalogsYml({
      list: {},
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");

    const yarnrc = await workspace.readYarnrc();
    expect(yarnrc.catalogs).toBeUndefined();
  });

  it("should preserve comments and formatting when updating catalogs", async () => {
    workspace = await createTestWorkspace();

    const existingYarnrc = await workspace.readYarnrcRaw();
    await workspace.writeYarnrcRaw(`${existingYarnrc}
# Yarn configuration
nodeLinker: node-modules # inline comment

# Registry configuration
npmRegistryServer: https://registry.npmjs.org

# Catalog configuration
catalogs:
  stable:
    react: npm:17.0.0
`);

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const rawContent = await workspace.readYarnrcRaw();
    expect(rawContent).toContain("# Yarn configuration");
    expect(rawContent).toContain("# inline comment");
    expect(rawContent).toContain("# Registry configuration");
    expect(rawContent).toContain("# Catalog configuration");
  });

  it("should preserve comments when updating both root and named catalogs", async () => {
    workspace = await createTestWorkspace();

    const existingYarnrc = await workspace.readYarnrcRaw();
    await workspace.writeYarnrcRaw(`${existingYarnrc}
# Root catalog
catalog:
  lodash: npm:4.0.0

# Named catalogs
catalogs:
  stable:
    react: npm:17.0.0
`);

    await workspace.writeCatalogsYml({
      list: {
        root: {
          lodash: "npm:4.17.21",
        },
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const rawContent = await workspace.readYarnrcRaw();
    expect(rawContent).toContain("# Root catalog");
    expect(rawContent).toContain("# Named catalogs");
  });

  it("should preserve comments when removing catalogs", async () => {
    workspace = await createTestWorkspace();

    const existingYarnrc = await workspace.readYarnrcRaw();
    await workspace.writeYarnrcRaw(`${existingYarnrc}
# Config comment
nodeLinker: node-modules

catalogs:
  stable:
    react: npm:18.0.0

# End comment
`);

    await workspace.writeCatalogsYml({
      list: {},
    });

    await workspace.yarn.catalogs.apply();

    const rawContent = await workspace.readYarnrcRaw();
    expect(rawContent).toContain("# Config comment");
    expect(rawContent).toContain("# End comment");
    expect(rawContent).not.toContain("catalogs:");
  });
});
