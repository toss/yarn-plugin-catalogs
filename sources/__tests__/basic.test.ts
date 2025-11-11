import { afterEach, describe, expect, it } from "vitest";
import {
  type TestWorkspace,
  createTestProtocolPlugin,
  createTestWorkspace,
  hasDependency,
} from "./utils";

describe("basic catalog functionality", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should add dependency using catalog protocol with named group", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("react@catalog:stable");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
  });

  it("should add dependency using catalog protocol with root group", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        root: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // Root catalog is accessed without group name
    const { stderr } = await workspace.yarn.add("react@catalog:");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
  });

  it("should handle multiple catalog groups", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
        beta: {
          react: "npm:19.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr: stderr1 } = await workspace.yarn.add("react@catalog:stable");
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);

    // Replace with beta version
    const { stderr: stderr2 } = await workspace.yarn.add("react@catalog:beta");
    expect(stderr2).toBe("");
    expect(await hasDependency(workspace, "react@npm:19.0.0")).toBe(true);
  });

  it("should add multiple dependencies from the same catalog", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          axios: "npm:1.6.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    await workspace.yarn.add("react@catalog:stable");
    await workspace.yarn.add("lodash@catalog:stable");
    await workspace.yarn.add("axios@catalog:stable");

    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
    expect(await hasDependency(workspace, "axios@npm:1.6.0")).toBe(true);
  });

  it("should fail when catalog group doesn't exist", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // Should fail because 'beta' group doesn't exist
    await expect(workspace.yarn.add("react@catalog:beta")).rejects.toThrow();
  });

  it("should fail when package doesn't exist in catalog", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // Should fail because 'lodash' is not in the catalog
    await expect(workspace.yarn.add("lodash@catalog:stable")).rejects.toThrow();
  });

  it("should work with both root and named catalogs", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        root: {
          react: "npm:18.0.0",
        },
        beta: {
          lodash: "npm:4.17.21",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr: stderr1 } = await workspace.yarn.add("react@catalog:");
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);

    const { stderr: stderr2 } = await workspace.yarn.add("lodash@catalog:beta");
    expect(stderr2).toBe("");
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
  });

  it("should handle devDependencies with catalog protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          typescript: "npm:5.3.3",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr } = await workspace.yarn.add("typescript@catalog:stable", "--dev");
    expect(stderr).toBe("");

    const pkg = await workspace.readPackageJson();
    expect(pkg.devDependencies?.typescript).toBe("catalog:stable");
  });

  it("should apply catalogs when catalogs.yml exists but is empty", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {},
    });

    const { stderr } = await workspace.yarn.catalogs.apply();
    expect(stderr).toBe("");
  });

  it("should add regular dependencies without catalog protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    // Should be able to add dependencies not in catalog without issues
    const { stderr } = await workspace.yarn.add("lodash@4.17.21");
    expect(stderr).toBe("");

    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);
  });

  it("should work with custom protocol in catalog", async () => {
    workspace = await createTestWorkspace();

    await createTestProtocolPlugin(workspace, "custom");

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "custom:18.0.0",
          lodash: "custom:4.17.21",
        },
      },
    });

    await workspace.yarn.catalogs.apply();

    const { stderr: stderr1 } = await workspace.yarn.add("react@catalog:stable");
    expect(stderr1).toBe("");
    expect(await hasDependency(workspace, "react@npm:18.0.0")).toBe(true);

    const { stderr: stderr2 } = await workspace.yarn.add("lodash@catalog:stable");
    expect(stderr2).toBe("");
    expect(await hasDependency(workspace, "lodash@npm:4.17.21")).toBe(true);

    const pkg = await workspace.readPackageJson();
    expect(pkg.dependencies?.react).toBe("catalog:stable");
    expect(pkg.dependencies?.lodash).toBe("catalog:stable");
  });
});
