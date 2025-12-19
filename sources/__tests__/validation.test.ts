import { afterEach, describe, expect, it } from "vitest";
import {
  type TestWorkspace,
  createTestWorkspace,
  hasDependency,
} from "./utils";

function validationMessage(packageName: string) {
  return `${packageName} is listed in the catalogs config`;
}

describe("validation", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  describe("catalog_protocol_usage rule", () => {
    describe("strict", () => {
      it("should error when running `yarn install` without catalog protocol", async () => {
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

      // TODO: Should error, but currently it is not possible to know exact descriptor input of `yarn add` command.
      // Related: https://github.com/yarnpkg/berry/pull/6994
      it.skip("should error when running `yarn add` without catalog protocol", async () => {
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

      it("should pass when running `yarn install` with catalog protocol", async () => {
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

      it("should pass when running `yarn add` with catalog protocol", async () => {
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

      it("should pass when running `yarn install` without catalog protocol if the package is not in the catalog", async () => {
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

      it("should pass when running `yarn add` without catalog protocol if the package is not in the catalog", async () => {
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
      it("should warn when running `yarn install` without catalog protocol", async () => {
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

        const { stdout } = await workspace.yarn.install();
        expect(stdout).toContain(validationMessage("react"));
      });

      // TODO: Should warn, but currently it is not possible to know exact descriptor input of `yarn add` command.
      // Related: https://github.com/yarnpkg/berry/pull/6994
      it.skip("should warn when running `yarn add` without catalog protocol", async () => {
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
        expect(stderr).toContain(validationMessage("react"));
      });

      it("should not print warnings when running `yarn install` with catalog protocol", async () => {
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

        const { stdout } = await workspace.yarn.install();
        expect(stdout).not.toContain(validationMessage("react"));
      });

      it("should not print warnings when running `yarn add` with catalog protocol", async () => {
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

      it("should not print warnings when running `yarn install` without catalog protocol if the package is not in the catalog", async () => {
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

        const { stdout } = await workspace.yarn.install();
        expect(stdout).not.toContain(validationMessage("lodash"));
      });

      it("should not print warnings when running `yarn add` without catalog protocol if the package is not in the catalog", async () => {
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
      it("should not print warnings when running `yarn install` with catalog protocol", async () => {
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

        const { stdout } = await workspace.yarn.install();
        expect(stdout).not.toContain(validationMessage("react"));
      });

      it("should not print warnings when running `yarn install` without catalog protocol", async () => {
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

        const { stdout } = await workspace.yarn.install();
        expect(stdout).not.toContain(validationMessage("react"));
      });

      it("should not print warnings when running `yarn add` with catalog protocol", async () => {
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

      it("should not print warnings when running `yarn add` without catalog protocol", async () => {
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
      it("should error when running `yarn install` with catalog protocol", async () => {
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

      it("should error when running `yarn add` with catalog protocol", async () => {
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
    });

    describe("no config", () => {
      it("should behave as 'optional' for `yarn install` when no validation config is provided", async () => {
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

        const { stdout } = await workspace.yarn.install();
        expect(stdout).not.toContain(validationMessage("react"));
      });

      it("should behave as 'optional' for `yarn add` when no validation config is provided", async () => {
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

        const { stderr } = await workspace.yarn.add("react@17.0.0");
        expect(stderr).toBe("");
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

        const { stdout } = await workspace.yarn.install();
        expect(stdout).not.toContain(validationMessage("react"));
      });

      it("should apply validation when pattern matches with wildcard", async () => {
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

      it("should use the first matching rule when multiple rules could match", async () => {
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

      it("should match if any pattern in the workspaces array matches", async () => {
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

      it("should match the exact workspace name", async () => {
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

      it("should not match when the exact name differs", async () => {
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
});