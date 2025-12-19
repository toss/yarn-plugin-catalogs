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

  describe("catalog_protocol_usage rule", () => {
    describe("strict", () => {
      it("errors when we try to `yarn install` without catalog protocol", async () => {
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

        await expect(workspace.yarn.install()).rejects.toThrow();
      });

      it("errors when we try to `yarn add` without catalog protocol", async () => {
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

        await expect(workspace.yarn.add("react@17.0.0")).rejects.toThrow();
      });

      it("passes when we try to `yarn install` with catalog protocol", async () => {
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

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toBe("");
      });

      it("passes when we try to `yarn add` with catalog protocol", async () => {
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

        const { stderr } = await workspace.yarn.add("react@catalog:stable");
        expect(stderr).toBe("");

        expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
      });

      it("passes when we try to `yarn install` without catalog protocol, but the package is not in the catalog", async () => {
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
          dependencies: { lodash: "4.17.21" },
        });

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toBe("");
      });

      it("passes when we try to `yarn add` without catalog protocol, but the package is not in the catalog", async () => {
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

        const { stderr } = await workspace.yarn.add("lodash@4.17.21");
        expect(stderr).toBe("");

        expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
      });
    });

    describe("warn", () => {
      it("warns when we try to `yarn install` without catalog protocol", async () => {
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

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toContain("react");
      });

      it("warns when we try to `yarn add` without catalog protocol", async () => {
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

        const { stderr } = await workspace.yarn.add("react@17.0.0");
        expect(stderr).toContain("react");
      });

      it("prints no warnings when we try to `yarn install` with catalog protocol", async () => {
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
          dependencies: { react: "catalog:stable" },
        });

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toBe("");
      });

      it("prints no warnings when we try to `yarn add` with catalog protocol", async () => {
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

        const { stderr } = await workspace.yarn.add("react@catalog:stable");
        expect(stderr).toBe("");

        expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
      });

      it("prints no warnings when we try to `yarn install` without catalog protocol, but the package is not in the catalog", async () => {
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
          dependencies: { lodash: "4.17.21" },
        });

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toBe("");
      });

      it("prints no warnings when we try to `yarn add` without catalog protocol, but the package is not in the catalog", async () => {
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

        const { stderr } = await workspace.yarn.add("lodash@4.17.21");
        expect(stderr).toBe("");

        expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
      });
    });

    describe("optional", () => {
      it("prints no warnings/errors when we try to `yarn install` with catalog protocol", async () => {
        workspace = await createTestWorkspace();

        await workspace.writeCatalogsYml({
          options: {
            default: ["stable"],
          },
          validation: [
            {
              workspaces: ["*"],
              rules: { catalog_protocol_usage: "optional" },
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

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toBe("");
      });

      it("prints no warnings/errors when we try to `yarn install` without catalog protocol", async () => {
        workspace = await createTestWorkspace();

        await workspace.writeCatalogsYml({
          options: {
            default: ["stable"],
          },
          validation: [
            {
              workspaces: ["*"],
              rules: { catalog_protocol_usage: "optional" },
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

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toBe("");
      });

      it("prints no warnings/errors when we try to `yarn add` with catalog protocol", async () => {
        workspace = await createTestWorkspace();

        await workspace.writeCatalogsYml({
          options: {
            default: ["stable"],
          },
          validation: [
            {
              workspaces: ["*"],
              rules: { catalog_protocol_usage: "optional" },
            },
          ],
          list: {
            stable: { react: "npm:18.0.0" },
          },
        });

        await workspace.yarn.catalogs.apply();

        const { stderr } = await workspace.yarn.add("react@catalog:stable");
        expect(stderr).toBe("");

        expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
      });

      it("prints no warnings/errors when we try to `yarn add` without catalog protocol", async () => {
        workspace = await createTestWorkspace();

        await workspace.writeCatalogsYml({
          options: {
            default: ["stable"],
          },
          validation: [
            {
              workspaces: ["*"],
              rules: { catalog_protocol_usage: "optional" },
            },
          ],
          list: {
            stable: { react: "npm:18.0.0" },
          },
        });

        await workspace.yarn.catalogs.apply();

        const { stderr } = await workspace.yarn.add("react@17.0.0");
        expect(stderr).toBe("");
      });
    });

    describe("restrict", () => {
      it("errors when we try to `yarn install` with catalog protocol", async () => {
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

        await expect(workspace.yarn.install()).rejects.toThrow();
      });

      it("errors when we try to `yarn add` with catalog protocol", async () => {
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

        await expect(
          workspace.yarn.add("react@catalog:stable"),
        ).rejects.toThrow();
      });

      it("errors when we try to `yarn install` without catalog protocol", async () => {
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
          dependencies: { react: "17.0.0" },
        });

        await expect(workspace.yarn.install()).rejects.toThrow();
      });

      it("errors when we try to `yarn add` without catalog protocol", async () => {
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

        await expect(workspace.yarn.add("react@17.0.0")).rejects.toThrow();
      });
    });

    describe("no config", () => {
      it("works as if it is 'optional' when no validation config is provided", async () => {
        workspace = await createTestWorkspace();

        await workspace.writeCatalogsYml({
          options: {
            default: ["stable"],
          },
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

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toBe("");
      });

      it("works as if it is 'optional' when validation array is empty", async () => {
        workspace = await createTestWorkspace();

        await workspace.writeCatalogsYml({
          options: {
            default: ["stable"],
          },
          validation: [],
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

        const { stderr } = await workspace.yarn.install();
        expect(stderr).toBe("");
      });
    });
  });

  describe("workspace pattern matching", () => {
    it("skips validation when no pattern matches", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["packages-*"],
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

      const { stderr } = await workspace.yarn.install();
      expect(stderr).toBe("");
    });

    it("applies validation when pattern matches with wildcard", async () => {
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

      await expect(workspace.yarn.install()).rejects.toThrow();
    });

    it("uses first matching rule when multiple rules could match", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["test-package"],
            rules: { catalog_protocol_usage: "optional" },
          },
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

      const { stderr } = await workspace.yarn.install();
      expect(stderr).toBe("");
    });

    it("matches if any pattern in workspaces array matches", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["service-*", "test-*"],
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

      await expect(workspace.yarn.install()).rejects.toThrow();
    });

    it("matches exact workspace name", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["test-package"],
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

      await expect(workspace.yarn.install()).rejects.toThrow();
    });

    it("does not match when exact name differs", async () => {
      workspace = await createTestWorkspace();

      await workspace.writeCatalogsYml({
        options: {
          default: ["stable"],
        },
        validation: [
          {
            workspaces: ["other-package"],
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

      const { stderr } = await workspace.yarn.install();
      expect(stderr).toBe("");
    });
  });
});
