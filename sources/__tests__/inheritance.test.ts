import { afterEach, describe, expect, it } from "vitest";
import {
  type TestWorkspace,
  createTestWorkspace,
  hasDependency,
} from "./utils";

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
    const { stderr: stderr1 } = await workspace.yarn.add(
      "react@catalog:stable/canary",
    );
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:19.0.0")).toBe(true);

    const { stderr: stderr2 } = await workspace.yarn.add(
      "lodash@catalog:stable/canary",
    );
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

    await workspace.yarn.catalogs.apply();

    // base/stable/canary should:
    // - override react (19.0.0)
    // - inherit lodash from base/stable (4.17.21)
    // - inherit next from base (12.0.0)
    const { stderr: stderr1 } = await workspace.yarn.add(
      "react@catalog:base/stable/canary",
    );
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:19.0.0")).toBe(true);

    const { stderr: stderr2 } = await workspace.yarn.add(
      "lodash@catalog:base/stable/canary",
    );
    expect(stderr2).toBe("");
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);

    const { stderr: stderr3 } = await workspace.yarn.add(
      "next@catalog:base/stable/canary",
    );
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
    const { stderr: stderr1 } = await workspace.yarn.add(
      "react@catalog:root/canary",
    );
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:19.0.0")).toBe(true);

    const { stderr: stderr2 } = await workspace.yarn.add(
      "lodash@catalog:root/canary",
    );
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

  it("should resolve package from parent group when not found in child", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          chalk: "npm:4.1.2",
        },
        "stable/canary": {
          react: "npm:18.2.0",
          lodash: "npm:4.17.20",
        },
        "stable/canary/next": {
          react: "npm:18.3.1",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:stable/canary/next",
        lodash: "catalog:stable/canary/next",
        chalk: "catalog:stable/canary/next",
      },
    });

    await workspace.yarn.install();

    expect(await hasDependency(workspace, "react@npm:18.3.1")).toBe(true);
    expect(await hasDependency(workspace, "lodash@npm:4.17.20")).toBe(true);
    expect(await hasDependency(workspace, "chalk@npm:4.1.2")).toBe(true);
  });

  it("should override parent group versions with child group versions", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          next: "npm:12.0.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
          lodash: "npm:4.17.20",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:stable/canary",
        lodash: "catalog:stable/canary",
        next: "catalog:stable/canary",
      },
    });

    await workspace.yarn.install();

    expect(await hasDependency(workspace, "react@npm:18.2.0")).toBe(true);
    expect(await hasDependency(workspace, "lodash@npm:4.17.20")).toBe(true);
    expect(await hasDependency(workspace, "next@npm:12.0.0")).toBe(true);
  });

  it("should handle deep inheritance chains", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        base: {
          lodash: "npm:4.17.21",
          react: "npm:18.0.0",
          next: "npm:12.0.0",
          "es-toolkit": "npm:1.39.6",
        },
        "base/level1": {
          react: "npm:18.1.0",
          next: "npm:12.1.0",
        },
        "base/level1/level2": {
          next: "npm:12.2.0",
        },
        "base/level1/level2/level3": {
          "es-toolkit": "npm:1.39.7",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        lodash: "catalog:base/level1/level2/level3",
        react: "catalog:base/level1/level2/level3",
        next: "catalog:base/level1/level2/level3",
        "es-toolkit": "catalog:base/level1/level2/level3",
      },
    });

    await workspace.yarn.install();

    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
    expect(await hasDependency(workspace, "react@npm:18.1.0")).toBe(true);
    expect(await hasDependency(workspace, "next@npm:12.2.0")).toBe(true);
    expect(await hasDependency(workspace, "es-toolkit@npm:1.39.7")).toBe(true);
  });

  it("should handle inheritance with root level packages", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        root: {
          lodash: "npm:4.17.21",
        },
        stable: {
          react: "npm:18.0.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:stable/canary",
        lodash: "catalog:",
      },
    });

    await workspace.yarn.install();

    expect(await hasDependency(workspace, "react@npm:18.2.0")).toBe(true);
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
  });

  it("should show warnings with inherited groups", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toContain("stable, stable/canary");
    expect(stderr).toContain("react@catalog:stable");
  });

  it("should handle validation with inherited groups", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "warn",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "17.0.0",
      },
    });

    const { stdout } = await workspace.yarn.install();
    expect(stdout).toContain("react");
  });

  it("should handle groups with repeated names in inheritance path", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        "group-a": {
          react: "npm:18.0.0",
          lodash: "npm:4.17.20",
        },
        "group-a/group-b": {
          lodash: "npm:4.17.21",
        },
        "group-a/group-b/group-a": {
          next: "npm:12.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:group-a/group-b/group-a",
        lodash: "catalog:group-a/group-b/group-a",
        next: "catalog:group-a/group-b/group-a",
      },
    });

    await workspace.yarn.install();

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
    expect(await hasDependency(workspace, "next@npm:12.0.0")).toBe(true);
  });
});
