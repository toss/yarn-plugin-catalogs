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

/**
 * Creates a simple test protocol plugin for testing chained protocol resolution
 */
export async function createTestProtocolPlugin(
  workspace: TestWorkspace,
  protocolName: string
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
