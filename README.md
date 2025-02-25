# yarn-plugin-catalog

Inspired by [pnpm Catalogs](https://pnpm.io/catalogs).

## Installation

```bash
yarn plugin import https://raw.githubusercontent.com/toss/yarn-plugin-catalog/main/bundles/%40yarnpkg/plugin-catalog.js
```

## Usage

You can make `catalog.yml` in the root of your project (in the location where `.yarnrc.yml` exist) like below.

```yaml
# in catalog.yml

# Can use root catalog without group name, e.g "react": "catalog:"
react: 18.0.0

# Grouped catalog should be referenced with theh name, e.g "react": "catalog:beta"
beta:
  react: 19.0.0
```

To use the catalog version, change the version in the `package.json`.

```json
{
  "dependencies": {
    "react": "catalog:"
  }
}
```
