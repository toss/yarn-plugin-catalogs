import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestWorkspace, TestWorkspace } from "./utils";
import { join } from "path";
import { readFile } from "fs/promises";

describe("Packing", () => {
  let workspace: TestWorkspace;

  beforeEach(async () => {
    workspace = await createTestWorkspace();
  });

  afterEach(async () => {
    await workspace.cleanup();
  });

  it("should resolve catalog protocols in packed package.json", async () => {
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            lodash: "^4.17.21",
            chalk: "^5.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      dependencies: {
        lodash: "catalog:stable",
        chalk: "catalog:stable",
      },
      devDependencies: {
        typescript: "^5.0.0",
      },
    });

    await workspace.yarn.install();

    await workspace.yarn(["pack", "--filename", "test.tgz"]);

    await workspace.yarn(["exec", "tar", "-xzf", "test.tgz"]);
    const packageJsonContent = await readFile(
      join(workspace.path, "package", "package.json"),
      "utf8",
    );
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies.lodash).toBe("npm:^4.17.21");
    expect(packageJson.dependencies.chalk).toBe("npm:^5.0.0");

    expect(packageJson.devDependencies.typescript).toBe("^5.0.0");
  });

  it("should handle nested alias groups in packaging", async () => {
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            lodash: "^4.17.21",
          },
          "stable/canary": {
            chalk: "^5.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      dependencies: {
        lodash: "catalog:stable/canary",
        chalk: "catalog:stable/canary",
      },
    });

    await workspace.yarn.install();
    await workspace.yarn(["pack", "--filename", "test.tgz"]);
    await workspace.yarn(["exec", "tar", "-xzf", "test.tgz"]);

    const packageJsonContent = await readFile(
      join(workspace.path, "package", "package.json"),
      "utf8",
    );
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies.lodash).toBe("npm:^4.17.21");
    expect(packageJson.dependencies.chalk).toBe("npm:^5.0.0");
  });

  it("should handle root alias group in packaging", async () => {
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          root: {
            lodash: "^4.17.21",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      dependencies: {
        lodash: "catalog:",
      },
    });

    await workspace.yarn.install();
    await workspace.yarn(["pack", "--filename", "test.tgz"]);
    await workspace.yarn(["exec", "tar", "-xzf", "test.tgz"]);

    const packageJsonContent = await readFile(
      join(workspace.path, "package", "package.json"),
      "utf8",
    );
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies.lodash).toBe("npm:^4.17.21");
  });

  it("should handle all dependency types during packaging", async () => {
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            lodash: "^4.17.21",
            chalk: "^5.0.0",
            typescript: "^5.0.0",
            jest: "^29.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      dependencies: {
        lodash: "catalog:stable",
      },
      devDependencies: {
        typescript: "catalog:stable",
      },

      optionalDependencies: {
        jest: "catalog:stable",
      },
    });

    await workspace.yarn.install();
    await workspace.yarn(["pack", "--filename", "test.tgz"]);
    await workspace.yarn(["exec", "tar", "-xzf", "test.tgz"]);

    const packageJsonContent = await readFile(
      join(workspace.path, "package", "package.json"),
      "utf8",
    );
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies.lodash).toBe("npm:^4.17.21");
    expect(packageJson.devDependencies.typescript).toBe("npm:^5.0.0");
    expect(packageJson.optionalDependencies.jest).toBe("npm:^29.0.0");
  });

  it("should skip ignored workspaces during packaging", async () => {
    await workspace.writeYarnrc({
      catalogs: {
        options: {
          ignoredWorkspaces: ["test-package"],
        },
        list: {
          stable: {
            lodash: "^4.17.21",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      dependencies: {
        lodash: "^4.17.21",
      },
    });

    await workspace.yarn.install();
    await workspace.yarn(["pack", "--filename", "test.tgz"]);
    await workspace.yarn(["exec", "tar", "-xzf", "test.tgz"]);

    const packageJsonContent = await readFile(
      join(workspace.path, "package", "package.json"),
      "utf8",
    );
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies.lodash).toBe("^4.17.21");
  });

  it("should throw error for invalid catalog dependencies during packaging", async () => {
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            chalk: "^5.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      dependencies: {
        chalk: "catalog:stable",
        lodash: "^4.17.21",
      },
    });

    await workspace.yarn.install();

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      dependencies: {
        chalk: "catalog:stable",
        lodash: "catalog:stable",
      },
    });

    await expect(workspace.yarn(["pack"])).rejects.toThrow();
  });

  it("should handle custom protocols in catalog versions", async () => {
    await workspace.writeYarnrc({
      catalogs: {
        list: {
          stable: {
            lodash: "^4.17.21",
            "@types/node": "^20.0.0",
          },
        },
      },
    });

    await workspace.writeJson("package.json", {
      name: "test-package",
      version: "1.0.0",
      dependencies: {
        lodash: "catalog:stable",
      },
      devDependencies: {
        "@types/node": "catalog:stable",
      },
    });

    await workspace.yarn.install();
    await workspace.yarn(["pack", "--filename", "test.tgz"]);
    await workspace.yarn(["exec", "tar", "-xzf", "test.tgz"]);

    const packageJsonContent = await readFile(
      join(workspace.path, "package", "package.json"),
      "utf8",
    );
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies.lodash).toBe("npm:^4.17.21");
    expect(packageJson.devDependencies["@types/node"]).toBe("npm:^20.0.0");
  });
});
