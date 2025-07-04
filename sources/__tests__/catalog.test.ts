import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  TestWorkspace,
  createTestProtocolPlugin,
  extractDependencies,
} from "./utils";

describe("yarn-plugin-catalogs", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should resolve catalog version from .yarnrc.yml catalogs", async () => {
    workspace = await createTestWorkspace();

    // Create .yarnrc.yml catalogs with version mappings
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            react: "npm:18.0.0",
            "react-dom": "npm:18.0.0",
            "es-toolkit": "npm:1.32.0",
          },
          legacy: {
            next: "npm:12.0.0",
            lodash: "npm:4.0.0",
          },
          beta: {
            "@rspack/core": "npm:1.2.0",
          },
        },
      },
    });

    // Create package.json with catalog version
    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:stable",
        "react-dom": "catalog:stable",
        "es-toolkit": "catalog:stable",
        next: "catalog:legacy",
        lodash: "catalog:legacy",
        "@rspack/core": "catalog:beta",
      },
    });

    // Install dependencies
    await workspace.yarn.install();

    // Verify that the correct version was resolved
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("react@npm:18.0.0");
    expect(dependencies).includes("react-dom@npm:18.0.0");
    expect(dependencies).includes("es-toolkit@npm:1.32.0");
    expect(dependencies).includes("next@npm:12.0.0");
    expect(dependencies).includes("lodash@npm:4.0.0");
    expect(dependencies).includes("@rspack/core@npm:1.2.0");
  });

  it("fallback to default protocol 'npm' if no protocol is provided", async () => {
    workspace = await createTestWorkspace();

    // Create .yarnrc.yml catalogs with version mappings
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          npm: {
            react: "18.0.0",
          },
        },
      },
    });

    // Create package.json with catalog version
    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:npm",
      },
    });

    // Install dependencies
    await workspace.yarn.install();

    // Verify that the correct version was resolved
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("react@npm:18.0.0");
  });

  it("fallback to root catalogs if no catalog group is provided", async () => {
    workspace = await createTestWorkspace();

    // Create .yarnrc.yml catalogs with version mappings
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          react: "18.0.0",
        },
      },
    });

    // Create package.json with catalog version
    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:",
      },
    });

    // Install dependencies
    await workspace.yarn.install();

    // Verify that the correct version was resolved
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("react@npm:18.0.0");
  });

  it("should fail when catalog alias does not exist", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            react: "npm:18.0.0",
          },
          legacy: {
            react: "npm:16.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:nonexistent",
        "react-dom": "catalog:legacy",
      },
    });

    // Install should fail with an error about the missing alias
    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should successfully resolve nested protocols through multiple plugins", async () => {
    workspace = await createTestWorkspace();

    // Create a simple test-protocol plugin
    await createTestProtocolPlugin(workspace, "test-protocol");

    // Create catalog.yml with version using the test protocol
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          test: {
            react: "test-protocol:18.0.0", // Uses our custom protocol
          },
        },
      },
    });

    // Create package.json referencing the catalog version
    await workspace.writeJson("package.json", {
      name: "test-workspace",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:test",
      },
    });

    // Install dependencies with the JSON flag to get structured output
    await workspace.yarn.install();

    // Run yarn info to check resolution without installing
    const { stdout } = await workspace.yarn(["info", "react", "--json"]);

    const info = JSON.parse(stdout.trim());

    // The version should ultimately be resolved to npm:18.0.0
    expect(info.value).toBe("react@npm:18.0.0");
  });

  it("should warn when adding a dependency without catalog protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          groupA: {
            react: "npm:18.0.0",
          },
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toContain("groupA");
    expect(stderr).toContain("react@catalog:groupA");
  });

  it("should warn when adding a dependency with multiple alias groups", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          groupA: {
            react: "npm:18.0.0",
          },
          groupB: {
            react: "npm:17.0.0",
          },
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toContain("groupA, groupB");
    expect(stderr).toContain("react@catalog:groupA");
  });

  it("should not warn when adding a dependency with catalog protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          groupA: {
            react: "npm:18.0.0",
          },
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react@catalog:groupA");
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(stderr).toBe("");
    expect(dependencies).includes("react@npm:18.0.0");
  });

  it("should not warn when adding a dependency not in catalogs config", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          next: "npm:12.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react@npm:18.0.0");
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(stderr).toBe("");
    expect(dependencies).includes("react@npm:18.0.0");
  });

  it("should use the default alias group if no group is provided", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
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
      },
    });

    const { stderr } = await workspace.yarn.add("react");
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(stderr).toBe("");
    expect(dependencies).includes("react@npm:18.0.0");
  });

  it("should fail when the default alias group is not found in the list", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          default: ["unknown"],
        },
        list: {
          stable: {
            react: "npm:18.0.0",
          },
        },
      },
    });

    await expect(workspace.yarn.add("react@npm:18.0.0")).rejects.toThrow();
  });

  it("should use the root alias group if it is specified", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          default: ["root"],
        },
        list: {
          react: "npm:18.0.0",
        },
      },
    });

    const { stderr } = await workspace.yarn.add("react");
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(stderr).toBe("");
    expect(dependencies).includes("react@npm:18.0.0");
  });

  it("should follow the priority based on the order of default alias groups", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          default: ["stable", "root"],
        },
        list: {
          next: "npm:12.0.0",
          lodash: "npm:4.0.0",
          stable: {
            react: "npm:17.0.0",
            lodash: "npm:3.0.0",
          },
        },
      },
    });

    await workspace.yarn.add("next");
    await workspace.yarn.add("react");
    await workspace.yarn.add("lodash");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(dependencies).includes("next@npm:12.0.0");
    expect(dependencies).includes("react@npm:17.0.0");
    expect(dependencies).includes("lodash@npm:3.0.0");
  });

  it("should warn when adding a dependency not in the default alias group", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
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
      },
    });

    await workspace.yarn.add("react");
    const { stderr } = await workspace.yarn.add("lodash");
    expect(stderr).toContain("lodash@catalog:stable");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);
    expect(dependencies).includes("react@npm:18.0.0");
  });

  it("should use the most frequently used alias group if 'max' is specified", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          default: "max"
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
      },
    });

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

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);
    expect(dependencies).includes("@use-funnel/core@npm:0.0.1");
  });

  it("should not use default alias group if workspace is ignored", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          default: ["root"],
          ignoredWorkspaces: ["workspace-ignored"],
        },
        list: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "workspace-ignored",
      version: "1.0.0",
      private: true,
      dependencies: {},
    });

    const { stderr } = await workspace.yarn.add("react");
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(stderr).toBe("");
    expect(dependencies).not.includes("react@npm:18.0.0");
  });

  it("should ignore workspaces matched by glob pattern", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          default: ["root"],
          ignoredWorkspaces: ["@ignored/*"],
        },
        list: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "@ignored/workspace",
      version: "1.0.0",
      private: true,
      dependencies: {},
    });

    const { stderr } = await workspace.yarn.add("react");
    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(stderr).toBe("");
    expect(dependencies).not.includes("react@npm:18.0.0");
  });

  it("should fail validation if workspace is ignored, but using the catalog protocol", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          ignoredWorkspaces: ["workspace-ignored"],
        },
        list: {
          react: "npm:18.0.0",
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "workspace-ignored",
      version: "1.0.0",
      private: true,
      dependencies: {
        react: "catalog:",
      },
    });

    await expect(workspace.yarn.install()).rejects.toThrow();
  });

  it("should fail when adding dependency to ignored workspace", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          ignoredWorkspaces: ["workspace-ignored"],
        },
        list: {
          stable: {
            lodash: "npm:2.0.0",
            react: "npm:18.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "workspace-ignored",
      version: "1.0.0",
      private: true,
      dependencies: {},
    });

    const { stderr } = await workspace.yarn.add("lodash");
    expect(stderr).toBe("");

    await expect(workspace.yarn.add("react@catalog:stable")).rejects.toThrow();
  });

  it("should success dlx with ignored workspace", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          ignoredWorkspaces: ["workspace-ignored"],
        },
        list: {
          stable: {
            '@jwoo0122/echo': "npm:1.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "workspace-ignored",
      version: "1.0.0",
      private: true,
      dependencies: {},
    });

    await expect(workspace.yarn(['dlx', '@jwoo0122/echo', '"hello, world"'])).resolves.not.toThrow();
  });

  it("should resolve patched dependency", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        list: {
          /**
           * @context test issue with the version specified in [issue#10](https://github.com/toss/yarn-plugin-catalogs/issues/10)
           */
          typescript: "5.8.3",
        },
      },
    });

    await workspace.yarn.add("typescript");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);

    expect(
      dependencies.some((dep) =>
        /typescript@patch:typescript@npm%3A5\.8\.3#optional!builtin<compat\/typescript>::version=5\.8\.3&hash=[a-f0-9]+/.test(
          dep
        )
      )
    ).toBe(true);
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

  it("should use default alias group without validation warning", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
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
      },
    });

    const { stdout, stderr } = await workspace.yarn.add("react");
    expect(stdout).not.toContain("catalog");
    expect(stderr).toBe("");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);
    expect(dependencies).includes("react@npm:17.0.0");
  });

  it("should use default alias group without validation error", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
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
      },
    });

    const { stderr } = await workspace.yarn.add("react");
    expect(stderr).toBe("");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);
    expect(dependencies).includes("react@npm:17.0.0");
  });
});
