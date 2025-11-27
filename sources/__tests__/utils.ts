import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { type PortablePath, npath, ppath, xfs } from "@yarnpkg/fslib";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";
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
    add(
      dep: string,
      ...flags: string[]
    ): Promise<{ stdout: string; stderr: string }>;
    catalogs: {
      apply(check?: boolean): Promise<{ stdout: string; stderr: string }>;
    };
  };
}

export async function createTestWorkspace(): Promise<TestWorkspace> {
  const mainProjectYarnPath = npath.fromPortablePath(
    ppath.join(
      npath.toPortablePath(process.cwd()),
      ".yarn/releases/yarn-4.11.0.cjs" as PortablePath,
    ),
  );

  const yarn = async (args: string[]) => {
    return execFileAsync("node", [mainProjectYarnPath, ...args], { cwd: path });
  };

  yarn.install = async () => await yarn(["install", "--no-immutable"]);
  yarn.info = async () => await yarn(["info", "--json"]);
  yarn.add = async (dep: string, ...flags: string[]) =>
    await yarn(["add", dep, ...flags]);
  yarn.catalogs = {
    apply: async (check?: boolean) => {
      const args = ["catalogs", "apply"];
      if (check) args.push("--check");
      return await yarn(args);
    },
  };

  const { path, cleanup } = await tmpDir({ unsafeCleanup: true });
  const portablePath = npath.toPortablePath(path);

  await yarn(["init", "-y"]);
  await yarn(["set", "version", "stable"]);

  const bundlePath = ppath.join(
    npath.toPortablePath(process.cwd()),
    "bundles/@yarnpkg/plugin-catalogs.js" as PortablePath,
  );
  await yarn(["plugin", "import", npath.fromPortablePath(bundlePath)]);

  const writeJson = async (filePath: string, content: unknown) => {
    const fullPath = ppath.join(portablePath, filePath as PortablePath);
    await xfs.writeFilePromise(fullPath, JSON.stringify(content, null, 2));
  };

  const writeYaml = async (content: unknown) => {
    const yarnrcPath = ppath.join(portablePath, ".yarnrc.yml" as PortablePath);
    const existingContent = await xfs
      .readFilePromise(yarnrcPath, "utf8")
      .catch(() => "");
    await xfs.writeFilePromise(
      yarnrcPath,
      `${existingContent}\n${yamlStringify(content)}`,
    );
  };

  const writeCatalogsYml = async (content: unknown) => {
    const catalogsYmlPath = ppath.join(
      portablePath,
      "catalogs.yml" as PortablePath,
    );
    await xfs.writeFilePromise(catalogsYmlPath, yamlStringify(content));
  };

  const readPackageJson = async () => {
    const pkgPath = ppath.join(portablePath, "package.json" as PortablePath);
    const content = await xfs.readFilePromise(pkgPath, "utf8");
    return JSON.parse(content);
  };

  const readYarnrc = async () => {
    const yarnrcPath = ppath.join(portablePath, ".yarnrc.yml" as PortablePath);
    const content = await xfs.readFilePromise(yarnrcPath, "utf8");
    return yamlParse(content);
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
            if (!dependency.range.startsWith('${protocolName}:')) {
              return dependency;
            }

            const version = dependency.range.slice('${protocolName}:'.length);

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

  const portablePath = npath.toPortablePath(workspace.path);
  const pluginPath = ppath.join(
    portablePath,
    `${protocolName}-plugin.js` as PortablePath,
  );
  await xfs.writeFilePromise(pluginPath, pluginCode);
  await workspace.yarn([
    "plugin",
    "import",
    npath.fromPortablePath(pluginPath),
  ]);

  return npath.fromPortablePath(pluginPath);
}

function extractDependencies(log: string): string[] {
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
