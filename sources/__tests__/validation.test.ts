import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  TestWorkspace,
  extractDependencies,
} from "./utils";

describe("validation", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should show warnings when validation is 'warn' (default)", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "warn",
        },
        list: {
          stable: {
            react: "npm:18.0.0",
          },
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react@17.0.0");
    expect(stderr).toContain("react");
    expect(stderr).toContain("react@catalog:stable");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);
    expect(dependencies).includes("react@npm:17.0.0");
  });

  it("should throw errors when validation is 'strict' during yarn add", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "strict",
        },
        list: {
          stable: {
            react: "npm:18.0.0",
          },
        },
      },
    });

    await expect(workspace.yarn.add("react@17.0.0")).rejects.toThrow();
  });

  it("should enforce during yarn install when validation is 'strict'", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "strict",
        },
        list: {
          stable: {
            react: "npm:18.0.0",
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

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should warn during yarn install when validation is 'warn'", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "warn",
        },
        list: {
          stable: {
            react: "npm:18.0.0",
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

    // Install should succeed but show warnings
    const { stdout } = await workspace.yarn.install();
    expect(stdout).toContain("react");
  });

  it("should not enforce on dependencies not in catalogs", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "strict",
        },
        list: {
          stable: {
            react: "npm:18.0.0",
          },
        },
      },
    });

    const { stderr } = await workspace.yarn.add("lodash@4.17.21");
    expect(stderr).toBe("");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);
    expect(dependencies).includes("lodash@npm:4.17.21");
  });

  it("should enforce with multiple catalog groups available", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "warn",
        },
        list: {
          stable: {
            react: "npm:18.0.0",
          },
          beta: {
            react: "npm:19.0.0-beta",
          },
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react@17.0.0");
    expect(stderr).toContain("react");
    expect(stderr).toContain("stable, beta");
    expect(stderr).toContain("react@catalog:stable");
  });

  it("should not enforce on ignored workspaces", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "strict",
          ignoredWorkspaces: ["test-package"],
        },
        list: {
          stable: {
            react: "npm:18.0.0",
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

    const { stderr } = await workspace.yarn.install();
    expect(stderr).toBe("");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);
    expect(dependencies).includes("react@npm:17.0.0");
  });

  it("should handle root catalog groups with validation", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          validation: "warn",
        },
        list: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react@17.0.0");
    expect(stderr).toContain("react");
    expect(stderr).toContain("react@catalog:");
  });
});
