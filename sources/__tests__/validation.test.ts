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

  describe("catalog_protocol_usage: strict", () => {
    it("should error when not using catalog protocol for package in catalogs", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "strict",
            },
          },
        ],
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

    it("should pass when using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "strict",
            },
          },
        ],
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
          react: "catalog:stable",
        },
      });

      const { stderr } = await workspace.yarn.install();
      expect(stderr).toBe("");
    });

    it("should not validate packages not in catalogs", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "strict",
            },
          },
        ],
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
  });

  describe("catalog_protocol_usage: optional", () => {
    it("should allow using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "optional",
            },
          },
        ],
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
          react: "catalog:stable",
        },
      });

      const { stderr } = await workspace.yarn.install();
      expect(stderr).toBe("");
    });

    it("should allow not using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "optional",
            },
          },
        ],
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
    });
  });

  describe("catalog_protocol_usage: restrict", () => {
    it("should error when using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "restrict",
            },
          },
        ],
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
          react: "catalog:stable",
        },
      });

      await expect(workspace.yarn.install()).rejects.toThrow();
    });

    it("should pass when not using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "restrict",
            },
          },
        ],
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
    });
  });

  describe("workspace pattern matching", () => {
    it("should skip validation when no pattern matches", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        validation: [
          {
            workspaces: ["packages-*"],
            rules: {
              catalog_protocol_usage: "strict",
            },
          },
        ],
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
    });

    it("should use first matching rule", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        validation: [
          {
            workspaces: ["test-package"],
            rules: {
              catalog_protocol_usage: "optional",
            },
          },
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "strict",
            },
          },
        ],
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
    });

    it("should match if any pattern in workspaces array matches", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["test-*", "service-*"],
            rules: {
              catalog_protocol_usage: "strict",
            },
          },
        ],
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
  });

  describe("no validation config", () => {
    it("should skip validation when no validation config is specified", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
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
    });

    it("should skip validation when validation array is empty", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [],
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
    });

    it("should warn when adding a dependency without catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["groupA"],
        },
        list: {
          groupA: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toContain("groupA");
      expect(stderr).toContain("react@catalog:groupA");
    });

    it("should warn when adding a dependency with multiple alias groups", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        list: {
          groupA: {
            react: "npm:18.0.0",
          },
          groupB: {
            react: "npm:17.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toContain("groupA, groupB");
      expect(stderr).toContain("react@catalog:groupA");
    });

    it("should not warn when adding a dependency with catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        list: {
          groupA: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      const { stderr } = await workspace.yarn.add("react@catalog:groupA");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    });

    it("should not warn when adding a dependency not in catalogs config", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        list: {
          groupA: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      const { stderr } = await workspace.yarn.add("lodash");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "lodash")).toBe(true);
    });
  });

  describe("default alias groups with validation", () => {
    it("should not suggest catalog protocol when restrict is set", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "restrict",
            },
          },
        ],
        list: {
          stable: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.yarn.add("react@17.0.0");

      expect(await hasDependency(workspace, "react@npm:17.0.0")).toBe(true);
    });

    it("should not warn when adding a dependency not in the default alias group", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["beta"],
        },
        list: {
          beta: {
            react: "npm:18.0.0",
          },
          stable: {
            react: "npm:17.0.0",
            lodash: "npm:3.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.yarn.add("react");
      const { stderr } = await workspace.yarn.add("lodash");
      expect(stderr).not.toContain("lodash@catalog:stable");

      expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    });

    it("should use default alias group without validation warning", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "warn",
            },
          },
        ],
        list: {
          stable: {
            react: "npm:17.0.0",
          },
          beta: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      const { stdout, stderr } = await workspace.yarn.add("react");
      expect(stdout).not.toContain("catalog");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "react@npm:17.0.0")).toBe(true);
    });

    it("should use default alias group without validation error", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "strict",
            },
          },
        ],
        list: {
          stable: {
            react: "npm:17.0.0",
          },
          beta: {
            react: "npm:18.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      const { stderr } = await workspace.yarn.add("react");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "react@npm:17.0.0")).toBe(true);
    });

    it("should use default alias group without validation error (default: max)", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: "max",
        },
        list: {
          beta: {
            react: "npm:18.0.0",
            lodash: "npm:3.0.0",
          },
          stable: {
            react: "npm:17.0.0",
            lodash: "npm:2.0.0",
          },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "test-workspace",
        version: "1.0.0",
        private: true,
        dependencies: {
          react: "catalog:stable",
        },
      });

      const { stderr } = await workspace.yarn.add("lodash");
      expect(stderr).toBe("");

      expect(await hasDependency(workspace, "lodash@npm:2.0.0")).toBe(true);
    });
  });
});
