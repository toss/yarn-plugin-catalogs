import { dir as tmpDir } from "tmp-promise";
import { writeFile } from "fs/promises";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { dump as yamlDump } from "js-yaml";
import * as fs from "fs/promises";

const execFileAsync = promisify(execFile);

export interface TestWorkspace {
  path: string;
  cleanup: () => Promise<void>;
  writeJson: (path: string, content: unknown) => Promise<void>;
  writeYarnrc: (content: unknown) => Promise<void>;
  yarn: {
    (args: string[]): Promise<{ stdout: string; stderr: string }>;
    install(): Promise<{ stdout: string; stderr: string }>;
    info(): Promise<{ stdout: string; stderr: string }>;
    add(dep: string): Promise<{ stdout: string; stderr: string }>;
  };
}

/**
 * Creates a temporary Yarn workspace for testing
 */
export async function createTestWorkspace(): Promise<TestWorkspace> {
  const mainProjectYarnPath = join(
    process.cwd(),
    ".yarn/releases/yarn-4.6.0.cjs",
  );

  const yarn = async (args: string[]) => {
    return execFileAsync("node", [mainProjectYarnPath, ...args], { cwd: path });
  };

  yarn.install = async () => await yarn(["install", "--no-immutable"]);
  yarn.info = async () => await yarn(["info", "--json"]);
  yarn.add = async (dep: string) => await yarn(["add", dep]);

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
    await writeFile(yarnrcPath, existingContent + "\n" + yamlDump(content));
  };

  return {
    path,
    cleanup,
    writeJson,
    writeYarnrc: writeYaml,
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
    const {structUtils, Resolver} = require('@yarnpkg/core');

    class TestProtocolResolver {
      supportsDescriptor(descriptor, opts) {
        return descriptor.range.startsWith('${protocolName}:');
      }

      supportsLocator(locator, opts) {
        return locator.reference.startsWith('${protocolName}:');
      }

      shouldPersistResolution(locator, opts) {
        return false;
      }

      bindDescriptor(descriptor, fromLocator, opts) {
        return descriptor;
      }

      getResolutionDependencies(descriptor, opts) {
        return {};
      }

      async getCandidates(descriptor, dependencies, opts) {
        const nextRange = descriptor.range.replace(/^${protocolName}:/, 'npm:');

        return opts.resolver.getCandidates(
          { ...descriptor, range: nextRange }, 
          dependencies, 
          opts
        );                         
      }

      async getSatisfying(descriptor, dependencies, locators, opts) { 
        const nextRange = descriptor.range.replace(/^${protocolName}:/, 'npm:');                                                                       
        
        return opts.resolver.getSatisfying(           
          { ...descriptor, range: nextRange }, 
          dependencies, 
          locators, 
          opts
        );                         
      }                                                

      async resolve(locator, opts) {
        const nextRange = locator.reference.slice(/^${protocolName}:/, 'npm:'); 
        
        return opts.resolver.resolve(           
          { ...locator, reference: nextRange }, 
          opts
        );                         
      }
    }
    
    return {
      default: {
        resolvers: [TestProtocolResolver],
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
