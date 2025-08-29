import {
  Descriptor,
  LinkType,
  Locator,
  MinimalResolveOptions,
  Package,
  ResolveOptions,
  Resolver,
  structUtils,
} from "@yarnpkg/core";
import { CATALOG_PROTOCOL } from "./constants";
import { CatalogConfigurationReader } from "./configuration";

export class CatalogResolver implements Resolver {
  private configReader = new CatalogConfigurationReader();

  supportsDescriptor(
    descriptor: Descriptor,
    _opts: MinimalResolveOptions,
  ): boolean {
    if (!descriptor.range.startsWith(CATALOG_PROTOCOL)) {
      return false;
    }

    return true;
  }

  supportsLocator(locator: Locator, _opts: MinimalResolveOptions): boolean {
    if (!locator.reference.startsWith(CATALOG_PROTOCOL)) {
      return false;
    }

    return true;
  }

  shouldPersistResolution(
    _locator: Locator,
    _opts: MinimalResolveOptions,
  ): boolean {
    return false;
  }

  bindDescriptor(
    descriptor: Descriptor,
    _fromLocator: Locator,
    _opts: MinimalResolveOptions,
  ): Descriptor {
    return descriptor;
  }

  getResolutionDependencies(
    _descriptor: Descriptor,
    _opts: MinimalResolveOptions,
  ): Record<string, Descriptor> {
    return {};
  }

  async getCandidates(
    descriptor: Descriptor,
    dependencies: Record<string, Package>,
    opts: ResolveOptions,
  ): Promise<Array<Locator>> {
    try {
      const aliasGroup = descriptor.range.slice(CATALOG_PROTOCOL.length);
      const dependencyName = structUtils.stringifyIdent(descriptor);

      const range = await this.configReader.getRange(
        opts.project,
        aliasGroup,
        dependencyName,
      );

      return opts.resolver.getCandidates(
        structUtils.makeDescriptor(descriptor, range),
        dependencies,
        opts,
      );
    } catch {
      throw new Error(
        `Failed to resolve catalog package: ${structUtils.stringifyDescriptor(descriptor)}`,
      );
    }
  }

  async getSatisfying(
    descriptor: Descriptor,
    dependencies: Record<string, Package>,
    locators: Array<Locator>,
    opts: ResolveOptions,
  ): Promise<{ locators: Array<Locator>; sorted: boolean }> {
    return opts.resolver.getSatisfying(
      descriptor,
      dependencies,
      locators,
      opts,
    );
  }

  async resolve(locator: Locator, opts: ResolveOptions): Promise<Package> {
    return opts.resolver.resolve(locator, opts);
  }
}
