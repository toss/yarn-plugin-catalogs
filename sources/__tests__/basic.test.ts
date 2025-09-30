import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  type TestWorkspace,
  hasDependency,
} from "./utils";

describe("basic catalog functionality (without plugin options)", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should work with root catalog without any plugin options", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalog: {
        react: "npm:18.0.0",
        lodash: "npm:4.17.21",
      },
    });

    await workspace.yarn.add("react@catalog:");
    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
  });

  it("should work with named catalogs without any plugin options", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
        beta: {
          react: "npm:19.0.0-beta",
          lodash: "npm:4.17.20",
        },
      },
    });

    await workspace.yarn.add("react@catalog:stable");
    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);

    await workspace.yarn.add("lodash@catalog:beta");
    expect(await hasDependency(workspace, "lodash@npm:4.17.20")).toBe(true);
  });

  it("should install dependencies using catalog protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        stable: {
          react: "npm:18.0.0",
          "react-dom": "npm:18.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:stable",
        "react-dom": "catalog:stable",
      },
    });

    await workspace.yarn.install();
    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    expect(await hasDependency(workspace, "react-dom@npm:18.0.0")).toBe(true);
  });

  it("should not interfere with regular npm protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalog: {
        react: "npm:18.0.0",
      },
    });

    // Add with explicit version (not using catalog)
    await workspace.yarn.add("lodash@4.17.21");
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);

    // Should not interfere with regular adds
    await workspace.yarn.add("underscore@1.13.6");
    expect(await hasDependency(workspace, "underscore@npm:1.13.6")).toBe(true);
  });

  it("should support both root and named catalogs together", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalog: {
        lodash: "npm:4.17.21",
      },
      catalogs: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.add("react@catalog:stable");
    await workspace.yarn.add("lodash@catalog:");

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
  });
});
