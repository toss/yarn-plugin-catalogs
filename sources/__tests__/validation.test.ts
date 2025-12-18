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

  describe("catalog_protocol_usage: always", () => {
    it("should error when not using catalog protocol for package in catalogs", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "always",
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

    it("should throw error during yarn add when not using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "always",
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

      await expect(workspace.yarn.add("react@17.0.0")).rejects.toThrow();
    });

    it("should pass when using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "always",
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
        validation: [
          {
            workspaces: ["*"],
            rules: {
              catalog_protocol_usage: "always",
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
    it("should match workspace using glob pattern", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        validation: [
          {
            workspaces: ["test-package"],
            rules: {
              catalog_protocol_usage: "always",
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

    it("should skip validation when no pattern matches", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        validation: [
          {
            workspaces: ["packages/**"],
            rules: {
              catalog_protocol_usage: "always",
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

  describe("first-match-wins semantics", () => {
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
              catalog_protocol_usage: "always",
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

  describe("no validation config", () => {
    it("should skip validation when no validation config is specified", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
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
  });

  describe("multiple workspace patterns in a rule", () => {
    it("should match if any pattern in workspaces array matches", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        validation: [
          {
            workspaces: ["test-*", "service-*"],
            rules: {
              catalog_protocol_usage: "always",
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
  });
});
