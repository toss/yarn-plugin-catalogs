import { afterEach, describe, expect, it } from "vitest";
import {
  type TestWorkspace,
  createTestWorkspace,
  hasDependency,
} from "./utils";

describe("validation", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should show warnings when validation is 'warn' (default)", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "warn",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("react@17.0.0");
    expect(stderr).toContain("react");
    expect(stderr).toContain("react@catalog:stable");

    expect(await hasDependency(workspace, "react@npm:17.0.0")).toBe(true);
  });

  it("should throw errors when validation is 'strict' during yarn add", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "strict",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await expect(workspace.yarn.add("react@17.0.0")).rejects.toThrow();
  });

  it("should enforce during yarn install when validation is 'strict'", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "strict",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
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

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should warn during yarn install when validation is 'warn'", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "warn",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
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

  it("should not enforce on dependencies not in catalogs", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "strict",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("lodash@4.17.21");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
  });

  it("should enforce with multiple catalog groups available", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "warn",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
        beta: {
          react: "npm:19.0.0-beta",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("react@17.0.0");
    expect(stderr).toContain("react");
    expect(stderr).toContain("stable, beta");
    expect(stderr).toContain("react@catalog:");
  });

  it("should not enforce on ignored workspaces", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "strict",
        ignoredWorkspaces: ["test-package"],
      },
      list: {
        stable: {
          react: "npm:18.0.0",
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

    const { stderr } = await workspace.yarn.install();
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "react@npm:17.0.0")).toBe(true);
  });

  it("should handle root catalog groups with validation", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "warn",
      },
      list: {
        root: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("react@17.0.0");
    expect(stderr).toContain("react");
    expect(stderr).toContain("react@catalog:");
  });

  it("should apply different validation levels per group", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: {
          beta: "warn",
          stable: "strict",
          legacy: "off",
        },
      },
      list: {
        beta: {
          react: "npm:18.0.0",
        },
        stable: {
          next: "npm:14.0.0",
        },
        legacy: {
          jquery: "npm:3.6.0",
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
        next: "13.0.0",
        jquery: "3.5.0",
      },
    });

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should apply most strict validation when package accessible from multiple groups", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: {
          beta: "warn",
          stable: "strict",
          legacy: "off",
        },
      },
      list: {
        beta: {
          lodash: "npm:4.17.21",
        },
        stable: {
          lodash: "npm:4.17.21",
        },
        legacy: {
          lodash: "npm:4.17.21",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        lodash: "4.17.20",
      },
    });

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should inherit validation settings through group hierarchy", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: {
          stable: "off",
          "stable/canary": "strict",
        },
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
        "stable/canary": {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
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

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should handle validation inheritance for packages that do not exist in the parent", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: {
          stable: "strict",
          "stable/canary": "off",
        },
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
        "stable/canary": {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        lodash: "4.17.20",
      },
    });

    const { stderr } = await workspace.yarn.install();
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "lodash@npm:4.17.20")).toBe(true);
  });

  it("should handle validation for root group", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: {
          root: "strict",
        },
      },
      list: {
        root: {
          react: "npm:18.0.0",
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

    await expect(workspace.yarn.install()).rejects.toThrow();
  });
});
