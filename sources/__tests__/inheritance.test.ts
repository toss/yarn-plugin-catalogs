import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  TestWorkspace,
  extractDependencies,
} from "./utils";

describe("catalog group inheritance", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should resolve package from parent group when not found in child", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            react: "npm:18.0.0",
            lodash: "npm:4.17.21",
            chalk: "npm:4.1.2",
          },
          "stable/canary": {
            react: "npm:18.2.0",
            lodash: "npm:4.17.20",
          },
          "stable/canary/next": {
            react: "npm:18.3.1",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:stable/canary/next",
        lodash: "catalog:stable/canary/next",
        chalk: "catalog:stable/canary/next",
      },
    });

    await workspace.yarn.install();

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("react@npm:18.3.1");
    expect(dependencies).includes("lodash@npm:4.17.20");
    expect(dependencies).includes("chalk@npm:4.1.2");
  });

  it("should override parent group versions with child group versions", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            react: "npm:18.0.0",
            lodash: "npm:4.17.21",
            next: "npm:12.0.0",
          },
          "stable/canary": {
            react: "npm:18.2.0",
            lodash: "npm:4.17.20",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:stable/canary",
        lodash: "catalog:stable/canary",
        next: "catalog:stable/canary",
      },
    });

    await workspace.yarn.install();

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("react@npm:18.2.0");
    expect(dependencies).includes("lodash@npm:4.17.20");
    expect(dependencies).includes("next@npm:12.0.0");
  });

  it("should handle deep inheritance chains", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          base: {
            lodash: "npm:4.17.21",
            react: "npm:18.0.0",
            next: "npm:12.0.0",
            "es-toolkit": "npm:1.39.6",
          },
          "base/level1": {
            react: "npm:18.1.0",
            next: "npm:12.1.0",
          },
          "base/level1/level2": {
            next: "npm:12.2.0",
          },
          "base/level1/level2/level3": {
            "es-toolkit": "npm:1.39.7",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        lodash: "catalog:base/level1/level2/level3",
        react: "catalog:base/level1/level2/level3",
        next: "catalog:base/level1/level2/level3",
        "es-toolkit": "catalog:base/level1/level2/level3",
      },
    });

    await workspace.yarn.install();

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("lodash@npm:4.17.21");
    expect(dependencies).includes("react@npm:18.1.0");
    expect(dependencies).includes("next@npm:12.2.0");
    expect(dependencies).includes("es-toolkit@npm:1.39.7");
  });

  it("should fail when parent group does not exist", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            react: "npm:18.0.0",
          },
          "nonexistent/child": {
            lodash: "npm:4.17.20",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:nonexistent/child",
      },
    });

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should handle inheritance with root level packages", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          lodash: "npm:4.17.21",
          stable: {
            react: "npm:18.0.0",
          },
          "stable/canary": {
            react: "npm:18.2.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:stable/canary",
        lodash: "catalog:stable/canary",
      },
    });

    await workspace.yarn.install();

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("react@npm:18.2.0");
    expect(dependencies).includes("lodash@npm:4.17.21");
  });

  it("should work with default alias groups and inheritance", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          default: ["stable/canary"],
        },
        list: {
          stable: {
            react: "npm:18.0.0",
            lodash: "npm:4.17.21",
          },
          "stable/canary": {
            react: "npm:18.2.0",
          },
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toBe("");

    const { stderr: stderrLodash } = await workspace.yarn.add("lodash");
    expect(stderrLodash).toBe("");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("react@npm:18.2.0");
    expect(dependencies).includes("lodash@npm:4.17.21");
  });

  it("should show warnings with inherited groups", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            react: "npm:18.0.0",
          },
          "stable/canary": {
            react: "npm:18.2.0",
          },
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toContain("stable, stable/canary");
    expect(stderr).toContain("react@catalog:stable");
  });

  it("should handle validation with inherited groups", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "warn",
          default: ["stable/canary"],
        },
        list: {
          stable: {
            react: "npm:18.0.0",
          },
          "stable/canary": {
            react: "npm:18.2.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "17.0.0",
      },
    });

    const { stdout } = await workspace.yarn.install();
    expect(stdout).toContain("react");
  });

  it("should handle groups with repeated names in inheritance path", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          "group-a": {
            react: "npm:18.0.0",
            lodash: "npm:4.17.20",
          },
          "group-a/group-b": {
            lodash: "npm:4.17.21",
          },
          "group-a/group-b/group-a": {
            next: "npm:12.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:group-a/group-b/group-a",
        lodash: "catalog:group-a/group-b/group-a",
        next: "catalog:group-a/group-b/group-a",
      },
    });

    await workspace.yarn.install();

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("react@npm:18.0.0");
    expect(dependencies).includes("lodash@npm:4.17.21");
    expect(dependencies).includes("next@npm:12.0.0");
  });
});
