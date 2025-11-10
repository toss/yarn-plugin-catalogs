import { afterEach, describe, expect, it } from "vitest";
import { type TestWorkspace, createTestWorkspace } from "./utils";

describe("validation", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should show warnings when validation is 'warn' and apply command is used", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "warn",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("react@17.0.0");
    expect(stderr).toContain("react");
    expect(stderr).toContain("catalog:stable");
  });

  it("should throw errors when validation is 'strict'", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "strict",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await expect(workspace.yarn.add("react@17.0.0")).rejects.toThrow();
  });

  it("should not enforce on dependencies not in catalogs", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: "strict",
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // lodash is not in catalogs, so it should install without issues
    const { stderr } = await workspace.yarn.add("lodash@4.17.21");
    expect(stderr).not.toContain("catalog");
  });

  it("should apply per-group validation levels", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        validation: {
          stable: "strict",
          beta: "warn",
        },
      },
      list: {
        stable: {
          react: "npm:18.0.0",
        },
        beta: {
          next: "npm:14.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // strict validation should throw
    await expect(workspace.yarn.add("react@17.0.0")).rejects.toThrow();

    // warn validation should succeed but show warning
    const { stderr } = await workspace.yarn.add("next@13.0.0");
    expect(stderr).toContain("next");
    expect(stderr).toContain("catalog:beta");
  });
});
