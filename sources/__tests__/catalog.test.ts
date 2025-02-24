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
        "es-toolkit": "npm:latest",
      },
      legacy: {
        next: "npm:^12",
        lodash: "npm:^4",
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
    const { stdout: listOutput } = await workspace.yarn(["info"]);
    expect(listOutput).toContain("react@npm:18.0.0");
    expect(listOutput).toContain("react-dom@npm:18.0.0");
    expect(listOutput).toContain("es-toolkit@npm:latest");
    expect(listOutput).toContain("next@npm:^12");
    expect(listOutput).toContain("lodash@npm:^4");
    expect(listOutput).toContain("@rspack/core@npm:1.2.0");
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
