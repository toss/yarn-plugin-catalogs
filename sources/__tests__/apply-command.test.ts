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

  it("should handle dry-run mode", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    const { stdout } = await workspace.yarn.catalogs.apply(true);
    expect(stdout).toContain("Dry run mode");
    expect(stdout).toContain("Would apply");

    // .yarnrc.yml should not be modified in dry-run mode
    const yarnrc = await workspace.readYarnrc();
    expect(yarnrc.catalogs).toBeUndefined();
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
});
