import {
  Descriptor,
  Locator,
  MinimalResolveOptions,
  Package,
  ResolveOptions,
  Resolver,
  structUtils,
} from "@yarnpkg/core";
import { CATALOG_PROTOCOL, configReader } from "./configuration";

export class CatalogResolver implements Resolver {
  supportsDescriptor(
    descriptor: Descriptor,
    _opts: MinimalResolveOptions,
  ): boolean {
    return descriptor.range.startsWith(CATALOG_PROTOCOL);
  }

  supportsLocator(locator: Locator, _opts: MinimalResolveOptions): boolean {
    return locator.reference.startsWith(CATALOG_PROTOCOL);
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
    descriptor: Descriptor,
    opts: MinimalResolveOptions,
  ): Record<string, Descriptor> {
    return {};
  }

  async getCandidates(
    descriptor: Descriptor,
    dependencies: Record<string, Package>,
    opts: ResolveOptions,
  ): Promise<Array<Locator>> {
    const catalogAlias = descriptor.range.slice(CATALOG_PROTOCOL.length);

    const nextRange = await configReader.getRange(
      opts.project,
      catalogAlias,
      structUtils.stringifyIdent(descriptor),
    );

    return opts.resolver.getCandidates(
      structUtils.makeDescriptor(descriptor, nextRange),
      dependencies,
      opts,
    );
  }

  async getSatisfying(
    descriptor: Descriptor,
    dependencies: Record<string, Package>,
    locators: Array<Locator>,
    opts: ResolveOptions,
  ): Promise<{
    locators: Array<Locator>;
    sorted: boolean;
  }> {
    const catalogAlias = descriptor.range.slice(CATALOG_PROTOCOL.length);

    const nextRange = await configReader.getRange(
      opts.project,
      catalogAlias,
      structUtils.stringifyIdent(descriptor),
    );

    return opts.resolver.getSatisfying(
      structUtils.makeDescriptor(descriptor, nextRange),
      dependencies,
      locators,
      opts,
    );
  }

  async resolve(locator: Locator, opts: ResolveOptions): Promise<Package> {
    const catalogAlias = locator.reference.slice(CATALOG_PROTOCOL.length);

    const nextRange = await configReader.getRange(
      opts.project,
      catalogAlias,
      structUtils.stringifyIdent(locator),
    );

    return opts.resolver.resolve(
      structUtils.makeLocator(locator, nextRange),
      opts,
    );
  }
}
