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

### 1. Create a catalogs.yml file

Create a `catalogs.yml` file in the root of your project (where your `.yarnrc.yml` exists):

```yaml
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
# In catalogs.yml
react: 18.0.0           // Will be transformed to "npm:18.0.0"
next: "npm:13.4.9"      // Protocol explicitly specified
lodash: "patch:lodash@4.17.21#./.patches/lodash.patch"  // Custom protocol
```

#### Scoped Packages

Scoped packages work as expected:

```yaml
# In catalogs.yml
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
