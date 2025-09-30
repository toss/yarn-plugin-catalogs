import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  type TestWorkspace,
  hasDependency,
} from "./utils";

describe("ignored workspaces", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should not use default alias group if workspace is ignored", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogsOptions: {
        default: ["root"],
        ignoredWorkspaces: ["workspace-ignored"],
      },
      catalogs: {
        root: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "workspace-ignored",
      version: "1.0.0",
      private: true,
      dependencies: {},
    });

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(false);
  });

  it("should ignore workspaces matched by glob pattern", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogsOptions: {
        default: ["root"],
        ignoredWorkspaces: ["@ignored/*"],
      },
      catalogs: {
        root: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "@ignored/workspace",
      version: "1.0.0",
      private: true,
      dependencies: {},
    });

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(false);
  });

  it("should fail validation if workspace is ignored, but using the catalog protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogsOptions: {
        ignoredWorkspaces: ["workspace-ignored"],
      },
      catalogs: {
        root: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "workspace-ignored",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:",
      },
    });

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should fail when adding dependency to ignored workspace", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogsOptions: {
        ignoredWorkspaces: ["workspace-ignored"],
      },
      catalogs: {
        stable: {
          lodash: "npm:2.0.0",
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "workspace-ignored",
      version: "1.0.0",
      private: true,
      dependencies: {},
    });

    const { stderr } = await workspace.yarn.add("lodash");
    expect(stderr).toBe("");

    await expect(workspace.yarn.add("react@catalog:stable")).rejects.toThrow();
  });

  it("should success dlx with ignored workspace", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogsOptions: {
        ignoredWorkspaces: ["workspace-ignored"],
      },
      catalogs: {
        stable: {
          "@jwoo0122/echo": "npm:1.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "workspace-ignored",
      version: "1.0.0",
      private: true,
      dependencies: {},
    });

    await expect(
      workspace.yarn(["dlx", "@jwoo0122/echo", '"hello, world"']),
    ).resolves.not.toThrow();
  });
});
