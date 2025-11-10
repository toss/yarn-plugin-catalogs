import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import * as fs from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { dump as yamlDump, load as yamlLoad } from "js-yaml";
import { dir as tmpDir } from "tmp-promise";

const execFileAsync = promisify(execFile);

export interface TestWorkspace {
  path: string;
  cleanup: () => Promise<void>;
  writeJson: (path: string, content: unknown) => Promise<void>;
  readPackageJson: () => Promise<any>;
  readYarnrc: () => Promise<any>;
  writeYarnrc: (content: unknown) => Promise<void>;
  writeCatalogsYml: (content: unknown) => Promise<void>;
  yarn: {
    (args: string[]): Promise<{ stdout: string; stderr: string }>;
    install(): Promise<{ stdout: string; stderr: string }>;
    info(): Promise<{ stdout: string; stderr: string }>;
    add(dep: string, ...flags: string[]): Promise<{ stdout: string; stderr: string }>;
    catalogs: {
      apply(dryRun?: boolean): Promise<{ stdout: string; stderr: string }>;
    };
  };
}

/**
 * Creates a temporary Yarn workspace for testing
 */
export async function createTestWorkspace(): Promise<TestWorkspace> {
  const mainProjectYarnPath = join(
    process.cwd(),
    ".yarn/releases/yarn-4.11.0.cjs",
  );

  const yarn = async (args: string[]) => {
    return execFileAsync("node", [mainProjectYarnPath, ...args], { cwd: path });
  };

  yarn.install = async () => await yarn(["install", "--no-immutable"]);
  yarn.info = async () => await yarn(["info", "--json"]);
  yarn.add = async (dep: string, ...flags: string[]) => await yarn(["add", dep, ...flags]);
  yarn.catalogs = {
    apply: async (dryRun?: boolean) => {
      const args = ["catalogs", "apply"];
      if (dryRun) args.push("--dry-run");
      return await yarn(args);
    },
  };

  const { path, cleanup } = await tmpDir({ unsafeCleanup: true });

  await yarn(["init", "-y"]);
  await yarn(["set", "version", "stable"]);

  await yarn([
    "plugin",
    "import",
    join(process.cwd(), "bundles/@yarnpkg/plugin-catalogs.js"),
  ]);

  const writeJson = async (filePath: string, content: unknown) => {
    await writeFile(join(path, filePath), JSON.stringify(content, null, 2));
  };

  const writeYaml = async (content: unknown) => {
    const yarnrcPath = join(path, ".yarnrc.yml");
    const existingContent = await fs
      .readFile(yarnrcPath, "utf8")
      .catch(() => "");
    await writeFile(yarnrcPath, `${existingContent}\n${yamlDump(content)}`);
  };

  const writeCatalogsYml = async (content: unknown) => {
    const catalogsYmlPath = join(path, "catalogs.yml");
    await writeFile(catalogsYmlPath, yamlDump(content));
  };

  const readPackageJson = async () => {
    const pkgPath = join(path, "package.json");
    const content = await fs.readFile(pkgPath, "utf8");
    return JSON.parse(content);
  };

  const readYarnrc = async () => {
    const yarnrcPath = join(path, ".yarnrc.yml");
    const content = await fs.readFile(yarnrcPath, "utf8");
    return yamlLoad(content);
  };

  return {
    path,
    cleanup,
    writeJson,
    readPackageJson,
    readYarnrc,
    writeYarnrc: writeYaml,
    writeCatalogsYml,
    yarn,
  };
}

/**
 * Creates a simple test protocol plugin for testing chained protocol resolution
 */
export async function createTestProtocolPlugin(
  workspace: TestWorkspace,
  protocolName: string,
): Promise<string> {
  const pluginCode = `
module.exports = {
  name: 'plugin-${protocolName}',
  factory: function(require) {
    const {structUtils} = require('@yarnpkg/core');
    
    return {
      default: {
        hooks: {
          reduceDependency(dependency, project) {
            // Only handle ${protocolName}: prefixed dependencies
            if (!dependency.range.startsWith('${protocolName}:')) {
              return dependency;
            }
            
            // Extract the version from the range
            const version = dependency.range.slice('${protocolName}:'.length);
            
            // Create a new descriptor with the resolved version
            return structUtils.makeDescriptor(
              structUtils.makeIdent(dependency.scope, dependency.name),
              \`npm:\$\{version\}\`
            );
          }
        }
      }
    };
  }
};`;

  const pluginPath = join(workspace.path, `${protocolName}-plugin.js`);
  await fs.writeFile(pluginPath, pluginCode, "utf8");

  // Import the plugin
  await workspace.yarn(["plugin", "import", pluginPath]);

  return pluginPath;
}

export function extractDependencies(log: string): string[] {
  return log
    .split("\n")
    .filter((str) => str != null && str.length > 0)
    .map(
      (depsString) =>
        JSON.parse(depsString) as { value: string; children: object },
    )
    .reduce((result, item) => [...result, item.value], [] as string[]);
}

export async function hasDependency(
  workspace: TestWorkspace,
  name: string,
): Promise<boolean> {
  const { stdout: listOutput } = await workspace.yarn.info();
  const dependencies = extractDependencies(listOutput);
  return dependencies.some((x) => x.startsWith(name));
}
