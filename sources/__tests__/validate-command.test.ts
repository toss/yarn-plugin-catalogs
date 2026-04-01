import { afterEach, describe, expect, it } from "vitest";
import { type TestWorkspace, createTestWorkspace } from "./utils";

function validationMessage(packageName: string) {
  return `${packageName} is listed in the catalogs config`;
}

describe("yarn catalogs validate", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should error when no catalogs.yml exists", async () => {
    workspace = await createTestWorkspace();

    await expect(workspace.yarn.catalogs.validate()).rejects.toThrow();
  });

  it("should pass when no validation rules are configured", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: { react: "npm:18.0.0" },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stdout } = await workspace.yarn.catalogs.validate();
    expect(stdout).toContain("No validation rules configured");
  });

  it("should error when catalogs are not applied", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      validation: [
        {
          workspaces: ["*"],
          rules: { catalog_protocol_usage: "strict" },
        },
      ],
      list: {
        stable: { react: "npm:18.0.0" },
      },
    });

    await expect(workspace.yarn.catalogs.validate()).rejects.toThrow();
  });

  describe("strict", () => {
    it("should error when a package is not using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: { catalog_protocol_usage: "strict" },
          },
        ],
        list: {
          stable: { react: "npm:18.0.0" },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "test-package",
        version: "1.0.0",
        private: true,
        dependencies: { react: "17.0.0" },
      });

      await expect(workspace.yarn.catalogs.validate()).rejects.toThrow();
    });

    it("should pass when a package is using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: { catalog_protocol_usage: "strict" },
          },
        ],
        list: {
          stable: { react: "npm:18.0.0" },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "test-package",
        version: "1.0.0",
        private: true,
        dependencies: { react: "catalog:stable" },
      });

      const { stderr } = await workspace.yarn.catalogs.validate();
      expect(stderr).toBe("");
    });
  });

  describe("warn", () => {
    it("should warn but succeed when a package is not using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: { catalog_protocol_usage: "warn" },
          },
        ],
        list: {
          stable: { react: "npm:18.0.0" },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "test-package",
        version: "1.0.0",
        private: true,
        dependencies: { react: "17.0.0" },
      });

      const { stdout } = await workspace.yarn.catalogs.validate();
      expect(stdout).toContain(validationMessage("react"));
    });
  });

  describe("restrict", () => {
    it("should error when a package is using catalog protocol", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["*"],
            rules: { catalog_protocol_usage: "restrict" },
          },
        ],
        list: {
          stable: { react: "npm:18.0.0" },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "test-package",
        version: "1.0.0",
        private: true,
        dependencies: { react: "catalog:stable" },
      });

      await expect(workspace.yarn.catalogs.validate()).rejects.toThrow();
    });
  });

  describe("workspace pattern matching", () => {
    it("should skip validation when no pattern matches", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["other-*"],
            rules: { catalog_protocol_usage: "strict" },
          },
        ],
        list: {
          stable: { react: "npm:18.0.0" },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "test-package",
        version: "1.0.0",
        private: true,
        dependencies: { react: "17.0.0" },
      });

      const { stderr } = await workspace.yarn.catalogs.validate();
      expect(stderr).toBe("");
    });

    it("should validate when pattern matches", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["test-*"],
            rules: { catalog_protocol_usage: "strict" },
          },
        ],
        list: {
          stable: { react: "npm:18.0.0" },
        },
      });

      await workspace.yarn.catalogs.apply();

      await workspace.writeJson("package.json", {
        name: "test-package",
        version: "1.0.0",
        private: true,
        dependencies: { react: "17.0.0" },
      });

      await expect(workspace.yarn.catalogs.validate()).rejects.toThrow();
    });
  });
});
