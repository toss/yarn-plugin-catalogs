import { describe, it, expect, afterEach } from "vitest";
import {
  createTestWorkspace,
  TestWorkspace,
  extractDependencies,
} from "./utils";

describe("edge cases and special scenarios", () => {
  let workspace: TestWorkspace;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
    }
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
          dep,
        ),
      ),
    ).toBe(true);
  });
});
