import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  TestWorkspace,
  createTestProtocolPlugin,
  extractDependencies,
} from "./utils";

describe("basic catalog functionality", () => {
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
});
