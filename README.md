# yarn-plugin-catalogs

A Yarn plugin that enables "Catalogs" - a workspace feature for defining dependency version ranges as reusable constants across your project.

Highly inspired by [pnpm Catalogs](https://pnpm.io/catalogs).

## Why use Catalogs?

In larger projects, especially monorepos, it's common to have the same dependencies used across multiple packages. Catalogs help you:

- **Maintain consistent versions** across your workspace
- **Simplify upgrades** by editing versions in just one place
- **Reduce merge conflicts** in package.json files
- **Standardize dependencies** across teams and repositories

## Installation

```bash
yarn plugin import https://raw.githubusercontent.com/toss/yarn-plugin-catalogs/main/bundles/%40yarnpkg/plugin-catalogs.js
```

## Usage

### 1. Add `catalogs` to `.yarnrc.yml`

```yaml
# in .yarnrc.yml

catalogs:
  list:
    # Root catalogs (can be referenced with just "catalog:")
    react: 18.0.0
    react-dom: 18.0.0
    typescript: 5.1.6

    # Named catalogs (must be referenced with "catalog:name")
    beta:
      react: 19.0.0
      react-dom: 19.0.0

    legacy:
      react: 17.0.2
      react-dom: 17.0.2
```

### 2. Reference catalog versions in your package.json

```json
{
  "dependencies": {
    "react": "catalog:", // Uses version from root catalog
    "react-dom": "catalog:", // Uses version from root catalog
    "typescript": "catalog:", // Uses version from root catalog

    "next": "catalog:beta", // Uses version from beta catalog
    "styled-components": "catalog:legacy" // Uses version from legacy catalog
  }
}
```

### Advanced Usage

#### Protocol Support

The plugin automatically adds the `npm:` protocol if none is specified in the catalog:

```yaml
# In .yarnrc.yml
catalogs:
  list:
    react: 18.0.0           // Will be transformed to "npm:18.0.0"
    next: "npm:13.4.9"      // Protocol explicitly specified
    lodash: "patch:lodash@4.17.21#./.patches/lodash.patch"  // Custom protocol
```

#### Scoped Packages

Scoped packages work as expected:

```yaml
# In .yarnrc.yml
catalogs:
  list:
    "@emotion/react": 11.11.1
    "@types/react": 18.2.15

    beta:
      "@tanstack/react-query": 5.0.0
```

```json
{
  "dependencies": {
    "@emotion/react": "catalog:",
    "@types/react": "catalog:",
    "@tanstack/react-query": "catalog:beta"
  }
}
```

#### Default Catalogs

The `default` option automatically selects a catalog for `yarn add` when no catalog name is specified. If multiple catalogs are listed, priority is determined by their order.

```yaml
# In .yarnrc.yml
catalogs:
  options:
    default: [beta, legacy]
  list:
    beta:
      react: 19.0.0
    legacy:
      react: 17.0.2
      typescript: 4.8.3
```

```sh
yarn add react # Same as `yarn add react@catalog:beta`
yarn add typescript # Same as `yarn add typescript@catalog:legacy`
```

To use the root catalogs as the default, just set the `default` option to `root`:

```yaml
# In .yarnrc.yml
catalogs:
  options:
    default: [root]
  list:
    react: 19.0.0
    react-dom: 19.0.0
```

```sh
yarn add react # Same as `yarn add react@catalog:`
```

The `default` option can also be set to a non-list value that defines a selection rule instead of specifying a catalog name. For example, `max` selects the most frequently used catalog in package.json as the default.

```yaml
# In .yarnrc.yml
catalogs:
  options:
    default: max
  list:
    beta:
      react: 19.0.0
      react-dom: 19.0.0
      typescript: 5.1.6
      next: 15.3.0
    legacy:
      react: 17.0.2
      react-dom: 17.0.2
      typescript: 4.8.3
      next: 13.4.9
```

```json
{
  "dependencies": {
    "react": "catalog:beta",
    "react-dom": "catalog:beta",
    "typescript": "catalog:legacy",
  }
}
```

```sh
yarn add next # Same as `yarn add next@catalog:beta`
              # because beta is the most frequently used catalog in package.json
```

Currently, only the `max` option is available, but additional options may be added in the future.

#### Disabling Catalogs

You can disable catalogs for certain workspaces by listing their names in the `ignoredWorkspaces` option. You can also use glob patterns here.

```yaml
# In .yarnrc.yml
catalogs:
  options:
    ignoredWorkspaces: [package, test-*]
  list:
    react: 19.0.0
    react-dom: 19.0.0
```

The ignored workspaces cannot use the catalog protocol, and the default alias group is also disabled for them.

#### Validation

The `validation` option allows you to configure whether to enforce catalog usage when dependencies listed in the catalog are used with actual versions instead of the catalog protocol.

- `warn` (default): Shows warning when catalog dependencies don't use the catalog protocol.
- `strict`: Throws error and prevents installation when catalog dependencies don't use catalog protocol.

```yaml
# In .yarnrc.yml
catalogs:
  options:
    validation: warn  # or "strict"
  list:
    react: 19.0.0
    react-dom: 19.0.0
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
