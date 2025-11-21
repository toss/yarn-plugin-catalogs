import { afterEach, describe, expect, it } from "vitest";
import { type TestWorkspace, createTestWorkspace } from "./utils";

describe("validateProject hook", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should pass validation when catalogs are in sync", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.install();
    expect(stderr).toBe("");
  });

  it("should pass validation when no catalogs.yml exists", async () => {
    workspace = await createTestWorkspace();

    const { stderr } = await workspace.yarn.install();
    expect(stderr).toBe("");
  });

  it("should fail validation when catalogs are out of sync", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should pass validation after applying changes", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await expect(workspace.yarn.install()).rejects.toThrow();

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.install();
    expect(stderr).toBe("");
  });
});
