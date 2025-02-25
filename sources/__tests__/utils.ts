import { dir as tmpDir } from "tmp-promise";
import { writeFile } from "fs/promises";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { dump as yamlDump } from "js-yaml";

const execFileAsync = promisify(execFile);

export interface TestWorkspace {
  path: string;
  cleanup: () => Promise<void>;
  writeJson: (path: string, content: unknown) => Promise<void>;
  writeYaml: (path: string, content: unknown) => Promise<void>;
  yarn: {
    (args: string[]): Promise<{ stdout: string; stderr: string }>;
    install(): Promise<{ stdout: string; stderr: string }>;
    info(): Promise<{ stdout: string; stderr: string }>;
  };
}

/**
 * Creates a temporary Yarn workspace for testing
 */
export async function createTestWorkspace(): Promise<TestWorkspace> {
  const yarn = async (args: string[]) => {
    return execFileAsync("yarn", args, { cwd: path });
  };

  yarn.install = async () => await yarn(["install", "--no-immutable"]);
  yarn.info = async () => await yarn(["info", "--json"]);

  const { path, cleanup } = await tmpDir({ unsafeCleanup: true });

  await yarn(["init", "-y"]);
  await yarn(["set", "version", "stable"]);

  await yarn([
    "plugin",
    "import",
    join(process.cwd(), "bundles/@yarnpkg/plugin-catalog.js"),
  ]);

  const writeJson = async (filePath: string, content: unknown) => {
    await writeFile(join(path, filePath), JSON.stringify(content, null, 2));
  };

  const writeYaml = async (filePath: string, content: unknown) => {
    await writeFile(join(path, filePath), yamlDump(content));
  };

  return {
    path,
    cleanup,
    writeJson,
    writeYaml,
    yarn,
  };
}
