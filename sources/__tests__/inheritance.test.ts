import { afterEach, describe, expect, it } from "vitest";
import { type TestWorkspace, createTestWorkspace, hasDependency } from "./utils";

describe("catalog inheritance", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should resolve single-level inheritance", async () => {
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

    await workspace.yarn.catalogs.apply();

    // stable/canary should inherit lodash from stable and override react
    const { stderr: stderr1 } = await workspace.yarn.add("react@catalog:stable/canary");
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:19.0.0")).toBe(true);

    const { stderr: stderr2 } = await workspace.yarn.add("lodash@catalog:stable/canary");
    expect(stderr2).toBe("");
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
  });

  it("should resolve multi-level inheritance", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        base: {
          react: "npm:17.0.0",
          lodash: "npm:4.0.0",
          "next": "npm:12.0.0",
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

    await workspace.yarn.catalogs.apply();

    // base/stable/canary should:
    // - override react (19.0.0)
    // - inherit lodash from base/stable (4.17.21)
    // - inherit next from base (12.0.0)
    const { stderr: stderr1 } = await workspace.yarn.add("react@catalog:base/stable/canary");
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:19.0.0")).toBe(true);

    const { stderr: stderr2 } = await workspace.yarn.add("lodash@catalog:base/stable/canary");
    expect(stderr2).toBe("");
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);

    const { stderr: stderr3 } = await workspace.yarn.add("next@catalog:base/stable/canary");
    expect(stderr3).toBe("");
    expect(await hasDependency(workspace, "next@npm:12.0.0")).toBe(true);
  });

  it("should handle root catalog in inheritance", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        root: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
        "root/canary": {
          react: "npm:19.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // root/canary should inherit lodash from root and override react
    const { stderr: stderr1 } = await workspace.yarn.add("react@catalog:root/canary");
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:19.0.0")).toBe(true);

    const { stderr: stderr2 } = await workspace.yarn.add("lodash@catalog:root/canary");
    expect(stderr2).toBe("");
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
  });

  it("should fail when parent group is not defined", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        "stable/canary": {
          react: "npm:19.0.0",
        },
      },
    });

    // Should throw error because parent 'stable' doesn't exist
    await expect(workspace.yarn.catalogs.apply()).rejects.toThrow();
  });

  it("should work with default groups and inheritance", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        default: ["stable/canary"],
      },
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

    await workspace.yarn.catalogs.apply();

    // Should automatically use stable/canary which has inherited packages
    const { stderr } = await workspace.yarn.add("lodash");
    expect(stderr).toBe("");
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
  });
});
