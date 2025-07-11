import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  TestWorkspace,
  extractDependencies,
} from "./utils";

describe("default alias groups", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
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

  it("should use the most frequently used alias group if 'max' is specified", async () => {
    workspace = await createTestWorkspace();

    await workspace.writeYarnrc({
      catalogs: {
        options: {
          default: "max",
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
});
