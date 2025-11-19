import { afterEach, describe, expect, it } from "vitest";
import {
  type TestWorkspace,
  createTestWorkspace,
  hasDependency,
} from "./utils";

describe("warnings and recommendations", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should warn when adding a dependency without catalog protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
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
        validation: "warn",
        default: ["stable"],
      },
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
        validation: "strict",
        default: ["stable"],
      },
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
