import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  TestWorkspace,
  extractDependencies,
} from "./utils";

describe("warnings and recommendations", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
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
    expect(stderr).not.toContain("lodash@catalog:stable");

    const { stdout: listOutput } = await workspace.yarn.info();
    const dependencies = extractDependencies(listOutput);
    expect(dependencies).includes("react@npm:18.0.0");
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
