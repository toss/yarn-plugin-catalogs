import { describe, it, expect, afterEach } from "vitest";
import { createTestWorkspace, TestWorkspace } from "./utils";

describe("yarn-plugin-catalog", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
  });

  it("should resolve catalog version from catalog.yml", async () => {
    workspace = await createTestWorkspace();

    // Create catalog.yml with version mappings
    await workspace.writeYaml("catalog.yml", {
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

    const dependencies = listOutput
      .split("\n")
      .filter((str) => str != null && str.length > 0)
      .map(
        (depsString) =>
          JSON.parse(depsString) as { value: string; children: object }
      )
      .reduce((result, item) => {
        return [...result, item.value];
      }, [] as string[]);

    expect(dependencies).includes("react@npm:18.0.0");
    expect(dependencies).includes("react-dom@npm:18.0.0");
    expect(dependencies).includes("es-toolkit@npm:1.32.0");
    expect(dependencies).includes("next@npm:12.0.0");
    expect(dependencies).includes("lodash@npm:4.0.0");
    expect(dependencies).includes("@rspack/core@npm:1.2.0");
  });

  it("fallback to default protocol 'npm' if no protocol is provided", async () => {
    workspace = await createTestWorkspace();

    // Create catalog.yml with version mappings
    await workspace.writeYaml("catalog.yml", {
      npm: {
        react: "18.0.0",
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

    const dependencies = listOutput
      .split("\n")
      .filter((str) => str != null && str.length > 0)
      .map(
        (depsString) =>
          JSON.parse(depsString) as { value: string; children: object }
      )
      .reduce((result, item) => {
        return [...result, item.value];
      }, [] as string[]);

    expect(dependencies).includes("react@npm:18.0.0");
  });

  it("should fail when catalog alias does not exist", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYaml("catalog.yml", {
      stable: {
        react: "npm:18.0.0",
      },
      legacy: {
        react: "npm:16.0.0",
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
});
