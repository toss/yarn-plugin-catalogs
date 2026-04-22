import { describe, expect, it } from "vitest";
import {
  createTestWorkspace,
  hasDependency,
} from "./utils";

describe("default alias groups", () => {
  it("should use the default alias group if no group is provided", async () => {
    await using workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        default: ["groupA"],
      },
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
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
  });

  it("should use the root alias group if it is specified", async () => {
    await using workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        default: ["root"],
      },
      list: {
        root: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
  });

  it("should follow the priority based on the order of default alias groups", async () => {
    await using workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        default: ["stable", "root"],
      },
      list: {
        root: {
          next: "npm:12.0.0",
          lodash: "npm:4.0.0",
        },
        stable: {
          react: "npm:17.0.0",
          lodash: "npm:3.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.yarn.add("next");
    await workspace.yarn.add("react");
    await workspace.yarn.add("lodash");

    expect(await hasDependency(workspace, "next@npm:12.0.0")).toBe(true);
    expect(await hasDependency(workspace, "react@npm:17.0.0")).toBe(true);
    expect(await hasDependency(workspace, "lodash@npm:3.0.0")).toBe(true);
  });

  it("should use the most frequently used alias group if 'max' is specified", async () => {
    await using workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        default: "max",
      },
      list: {
        beta: {
          react: "npm:18.0.0",
          lodash: "npm:3.0.0",
          next: "npm:12.0.0",
          "@use-funnel/core": "npm:0.0.9",
        },
        stable: {
          react: "npm:17.0.0",
          lodash: "npm:2.0.0",
          next: "npm:11.0.0",
          "@use-funnel/core": "npm:0.0.1",
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
        lodash: "catalog:stable",
        next: "catalog:beta",
      },
    });

    const { stderr } = await workspace.yarn.add("@use-funnel/core");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "@use-funnel/core@npm:0.0.1")).toBe(
      true,
    );
  });

  it("should not automatically suggest default catalog group when validation rule is 'restrict'", async () => {
    await using workspace = await createTestWorkspace();

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
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("react@17.0.0");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "react@npm:17.0.0")).toBe(true);
  });

  it("should install normally when package is not in any catalog", async () => {
    await using workspace = await createTestWorkspace();

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

    const { stderr } = await workspace.yarn.add("@module-federation/vite");
    expect(stderr).toBe("");

    const packageJson = await workspace.readPackageJson();
    const version = packageJson.dependencies["@module-federation/vite"];

    expect(version).toBeDefined();
    expect(version).not.toContain("catalog:");
  });

  it("should not match scoped package with unscoped package of same name in catalog", async () => {
    await using workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        default: ["stable"],
      },
      list: {
        stable: {
          vite: "npm:5.0.0",
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("@module-federation/vite");
    expect(stderr).toBe("");

    const packageJson = await workspace.readPackageJson();
    const version = packageJson.dependencies["@module-federation/vite"];

    expect(version).toBeDefined();
    expect(version).not.toContain("catalog:");
  });
});
