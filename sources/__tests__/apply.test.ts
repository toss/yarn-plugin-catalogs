import { describe, it, expect, afterEach } from "vitest";
import { createTestWorkspace, type TestWorkspace } from "./utils";
import { parseSyml } from "@yarnpkg/parsers";
import { join } from "node:path";
import * as fs from "node:fs/promises";

describe("catalogs apply command", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should apply root catalog only", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        root: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
      },
    });

    const { stderr } = await workspace.yarn(["catalogs", "apply"]);
    expect(stderr).toBe("");

    const yarnrcContent = await fs.readFile(
      join(workspace.path, ".yarnrc.yml"),
      "utf8",
    );
    const yarnrc = parseSyml(yarnrcContent);

    expect(yarnrc.catalog).toEqual({
      react: "npm:18.0.0",
      lodash: "npm:4.17.21",
    });
    expect(yarnrc.catalogs).toBeUndefined();
  });

  it("should apply named catalogs only", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
          typescript: "npm:5.0.0",
        },
        beta: {
          react: "npm:19.0.0",
          typescript: "npm:5.1.0",
        },
      },
    });

    const { stderr } = await workspace.yarn(["catalogs", "apply"]);
    expect(stderr).toBe("");

    const yarnrcContent = await fs.readFile(
      join(workspace.path, ".yarnrc.yml"),
      "utf8",
    );
    const yarnrc = parseSyml(yarnrcContent);

    expect(yarnrc.catalog).toBeUndefined();
    expect(yarnrc.catalogs).toEqual({
      stable: {
        react: "npm:18.0.0",
        typescript: "npm:5.0.0",
      },
      beta: {
        react: "npm:19.0.0",
        typescript: "npm:5.1.0",
      },
    });
  });

  it("should apply both root and named catalogs", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        root: {
          lodash: "npm:4.17.21",
        },
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn(["catalogs", "apply"]);
    expect(stderr).toBe("");

    const yarnrcContent = await fs.readFile(
      join(workspace.path, ".yarnrc.yml"),
      "utf8",
    );
    const yarnrc = parseSyml(yarnrcContent);

    expect(yarnrc.catalog).toEqual({
      lodash: "npm:4.17.21",
    });
    expect(yarnrc.catalogs).toEqual({
      stable: {
        react: "npm:18.0.0",
      },
    });
  });

  it("should resolve single level inheritance", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          typescript: "npm:5.1.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
          typescript: "npm:5.2.0",
        },
      },
    });

    const { stderr } = await workspace.yarn(["catalogs", "apply"]);
    expect(stderr).toBe("");

    const yarnrcContent = await fs.readFile(
      join(workspace.path, ".yarnrc.yml"),
      "utf8",
    );
    const yarnrc = parseSyml(yarnrcContent);

    expect(yarnrc.catalogs).toEqual({
      stable: {
        react: "npm:18.0.0",
        lodash: "npm:4.17.21",
        typescript: "npm:5.1.0",
      },
      "stable/canary": {
        react: "npm:18.2.0",
        lodash: "npm:4.17.21", // inherited
        typescript: "npm:5.2.0",
      },
    });
  });

  it("should resolve multi-level inheritance", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          typescript: "npm:5.1.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
        },
        "stable/canary/next": {
          typescript: "npm:5.3.0",
        },
      },
    });

    const { stderr } = await workspace.yarn(["catalogs", "apply"]);
    expect(stderr).toBe("");

    const yarnrcContent = await fs.readFile(
      join(workspace.path, ".yarnrc.yml"),
      "utf8",
    );
    const yarnrc = parseSyml(yarnrcContent);

    expect(yarnrc.catalogs).toEqual({
      stable: {
        react: "npm:18.0.0",
        lodash: "npm:4.17.21",
        typescript: "npm:5.1.0",
      },
      "stable/canary": {
        react: "npm:18.2.0",
        lodash: "npm:4.17.21",
        typescript: "npm:5.1.0",
      },
      "stable/canary/next": {
        react: "npm:18.2.0",
        lodash: "npm:4.17.21",
        typescript: "npm:5.3.0",
      },
    });
  });

  it("should preserve other yarnrc settings", async () => {
    workspace = await createTestWorkspace();

    // Add some existing settings to .yarnrc.yml
    await workspace.writeYarnrc({
      nodeLinker: "node-modules",
      enableGlobalCache: true,
    });

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn(["catalogs", "apply"]);
    expect(stderr).toBe("");

    const yarnrcContent = await fs.readFile(
      join(workspace.path, ".yarnrc.yml"),
      "utf8",
    );
    const yarnrc = parseSyml(yarnrcContent);

    expect(yarnrc.nodeLinker).toBe("node-modules");
    expect(yarnrc.enableGlobalCache).toBeTruthy();
    expect(yarnrc.catalogs).toEqual({
      stable: {
        react: "npm:18.0.0",
      },
    });
  });

  it("should completely overwrite existing catalogs", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalog: {
        oldPackage: "npm:1.0.0",
      },
      catalogs: {
        old: {
          oldPackage: "npm:2.0.0",
        },
      },
    });

    await workspace.writeCatalogsYml({
      list: {
        root: {
          newPackage: "npm:3.0.0",
        },
        new: {
          newPackage: "npm:4.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn(["catalogs", "apply"]);
    expect(stderr).toBe("");

    const yarnrcContent = await fs.readFile(
      join(workspace.path, ".yarnrc.yml"),
      "utf8",
    );
    const yarnrc = parseSyml(yarnrcContent);

    expect(yarnrc.catalog).toEqual({
      newPackage: "npm:3.0.0",
    });
    expect(yarnrc.catalogs).toEqual({
      new: {
        newPackage: "npm:4.0.0",
      },
    });
    expect(yarnrc.catalog.oldPackage).toBeUndefined();
    expect(yarnrc.catalogs?.old).toBeUndefined();
  });

  it("should fail when catalogs.yml doesn't exist", async () => {
    workspace = await createTestWorkspace();

    await expect(workspace.yarn(["catalogs", "apply"])).rejects.toThrow();
  });

  it("should fail when catalogs.yml has no list field", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      options: {
        default: ["stable"],
      },
    });

    await expect(workspace.yarn(["catalogs", "apply"])).rejects.toThrow();
  });

  it("should fail when parent group doesn't exist", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        "stable/canary": {
          react: "npm:18.0.0",
        },
      },
    });

    await expect(workspace.yarn(["catalogs", "apply"])).rejects.toThrow();
  });

  it("should work with --dry-run flag", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeCatalogsYml({
      list: {
        stable: {
          react: "npm:18.0.0",
        },
      },
    });

    const { stdout, stderr } = await workspace.yarn([
      "catalogs",
      "apply",
      "--dry-run",
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain('react: "npm:18.0.0"');

    // .yarnrc.yml should not be modified
    const yarnrcContent = await fs.readFile(
      join(workspace.path, ".yarnrc.yml"),
      "utf8",
    );
    const yarnrc = parseSyml(yarnrcContent);

    expect(yarnrc.catalogs).toBeUndefined();
  });
});
