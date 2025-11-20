import { afterEach, describe, expect, it } from "vitest";
import {
  type TestWorkspace,
  createTestWorkspace,
  hasDependency,
} from "./utils";

describe("workspace filtering (included/ignored workspaces)", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  describe("ignoredWorkspaces (opt-out)", () => {
    it("should not use default alias group if workspace is ignored", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["root"],
          ignoredWorkspaces: ["workspace-ignored"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

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

      await workspace.writeCatalogsYml({
        options: {
          default: ["root"],
          ignoredWorkspaces: ["@ignored/*"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

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

      await workspace.writeCatalogsYml({
        options: {
          ignoredWorkspaces: ["workspace-ignored"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

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
  });

  describe("includedWorkspaces (opt-in)", () => {
    it("should use catalog for included workspace", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["root"],
          includedWorkspaces: ["workspace-included"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "workspace-included",
        version: "1.0.0",
        private: true,
        dependencies: {},
      });

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toBe("");
      expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    });

    it("should not use catalog for non-included workspace", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["root"],
          includedWorkspaces: ["workspace-included"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "workspace-not-included",
        version: "1.0.0",
        private: true,
        dependencies: {},
      });

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toBe("");
      expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(false);
    });

    it("should include workspaces matched by glob pattern", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["root"],
          includedWorkspaces: ["@included/*"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "@included/workspace",
        version: "1.0.0",
        private: true,
        dependencies: {},
      });

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    });

    it("should exclude workspaces not matching included pattern", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["root"],
          includedWorkspaces: ["@included/*"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "@other/workspace",
        version: "1.0.0",
        private: true,
        dependencies: {},
      });

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(false);
    });
  });

  describe("includedWorkspaces and ignoredWorkspaces interaction", () => {
    it("should exclude workspace that matches both included and ignored", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["root"],
          includedWorkspaces: ["@included/*"],
          ignoredWorkspaces: ["@included/excluded"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "@included/excluded",
        version: "1.0.0",
        private: true,
        dependencies: {},
      });

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(false);
    });

    it("should include workspace that matches included but not ignored", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["root"],
          includedWorkspaces: ["@included/*"],
          ignoredWorkspaces: ["@included/excluded"],
        },
        list: {
          root: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "@included/allowed",
        version: "1.0.0",
        private: true,
        dependencies: {},
      });

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    });
  });
});
