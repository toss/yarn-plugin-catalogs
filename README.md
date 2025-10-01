# yarn-plugin-catalogs

**Extended options plugin for Yarn's Catalogs feature.**

Starting from Yarn 4.10.0, Catalogs are natively supported by Yarn. This plugin provides **additional options** on top of Yarn's implementation, including default alias groups, workspace ignoring, and validation settings.

For basic Catalogs functionality, refer to [Yarn's official documentation](https://yarnpkg.com/features/catalogs).

## Requirements

- **Yarn 4.10.0 or higher** (for Catalogs support)

## Why use this plugin?

While Yarn 4.10+ provides native catalog support, this plugin extends that functionality with:

- **Catalogs management** - Define catalogs in `catalogs.yml` with inheritance support and apply them to `.yarnrc.yml`
- **Inheritance** - Hierarchical catalog groups using `/` delimiter (e.g., `stable/canary/next`)
- **Default alias groups** - Automatically apply catalog protocols when adding dependencies
- **Workspace ignoring** - Disable catalogs for specific workspaces using glob patterns
- **Validation levels** - Enforce catalog usage with configurable warning or error levels
- **Group-specific validation** - Different validation rules for different catalog groups

## Installation

```bash
yarn plugin import https://raw.githubusercontent.com/toss/yarn-plugin-catalogs/main/bundles/%40yarnpkg/plugin-catalogs.js
```

## Features

### Catalog Management with `catalogs.yml`

Define your catalogs in a single `catalogs.yml` file with support for inheritance, then apply them to `.yarnrc.yml` using the `yarn catalogs apply` command.

**catalogs.yml:**
```yaml
options:
  default: [stable/canary]
  validation: warn

list:
  root:
    lodash: npm:4.17.21

  stable:
    react: npm:18.0.0
    typescript: npm:5.1.0

  stable/canary:
    react: npm:18.2.0      # Overrides stable
    # typescript: npm:5.1.0  (inherited from stable)

  stable/canary/next:
    react: npm:18.3.0      # Overrides stable/canary
    # typescript: npm:5.1.0  (inherited from stable)
```

**Apply to .yarnrc.yml:**
```bash
yarn catalogs apply
# ✓ Applied 1 root catalog and 3 named catalog groups to .yarnrc.yml
```

**After applying, .yarnrc.yml contains:**
```yaml
catalog:
  lodash: npm:4.17.21

catalogs:
  stable:
    react: npm:18.0.0
    typescript: npm:5.1.0

  stable/canary:
    react: npm:18.2.0
    typescript: npm:5.1.0 # Inherited and resolved

  stable/canary/next:
    react: npm:18.3.0
    typescript: npm:5.1.0 # Inherited and resolved
```

This plugin reads extended options from the `options` field in `catalogs.yml`:

### Default Alias Groups

Automatically applies catalog protocols when adding dependencies.

```yaml
# in catalogs.yml
options:
  default: [beta, legacy]  # Priority order
```

```yaml
# in .yarnrc.yml
catalogs:
  beta:
    react: npm:19.0.0
  legacy:
    react: npm:17.0.2
    typescript: npm:4.8.3
```

```sh
yarn add react      # Automatically becomes: yarn add react@catalog:beta
yarn add typescript # Automatically becomes: yarn add typescript@catalog:legacy
```

#### Using `root` as Default

```yaml
# in catalogs.yml
options:
  default: [root]  # Use root catalog as default
```

```yaml
# in .yarnrc.yml
catalog:
  react: npm:19.0.0
  react-dom: npm:19.0.0
```

```sh
yarn add react  # Same as: yarn add react@catalog:
```

#### Using `max` Strategy

The `max` option selects the most frequently used catalog in your package.json.

```yaml
# in catalogs.yml
options:
  default: max
```

```yaml
# in .yarnrc.yml
catalogs:
  beta:
    react: npm:19.0.0
    typescript: npm:5.1.6
  legacy:
    react: npm:17.0.2
    typescript: npm:4.8.3
```

```json
{
  "dependencies": {
    "react": "catalog:beta",
    "react-dom": "catalog:beta",
    "typescript": "catalog:legacy"
  }
}
```

```sh
yarn add next  # Will use "catalog:beta" (most frequent)
```

### Ignoring Workspaces

Disable catalog features for specific workspaces using glob patterns.

```yaml
# in catalogs.yml
options:
  ignoredWorkspaces: [package, test-*]
```

```yaml
# in .yarnrc.yml
catalog:
  react: npm:19.0.0
```

Ignored workspaces:
- Cannot use the `catalog:` protocol
- Default alias groups are disabled
- Validation is skipped

### Validation

Enforce catalog usage when dependencies listed in catalogs are added with actual versions.

```yaml
# in catalogs.yml
options:
  validation: warn  # "warn" | "strict" | "off"
```

```yaml
# in .yarnrc.yml
catalog:
  react: npm:19.0.0
  lodash: npm:4.17.21
```

- **`warn`** (default): Shows warnings when catalog dependencies don't use the catalog protocol
- **`strict`**: Throws errors and prevents installation
- **`off`**: Disables validation

#### Group-Specific Validation

Configure different validation levels for different catalog groups:

```yaml
# in catalogs.yml
options:
  validation:
    beta: warn
    stable: strict
    legacy: off
```

```yaml
# in .yarnrc.yml
catalogs:
  beta:
    react: npm:18.0.0
  stable:
    next: npm:14.0.0
  legacy:
    jquery: npm:3.6.0
```

When a package exists in multiple groups, the strictest validation level applies (`strict` > `warn` > `off`).

## Commands

### `yarn catalogs apply`

Applies catalog definitions from `catalogs.yml` to `.yarnrc.yml`, resolving all inheritance and completely replacing existing catalog configurations.

**Usage:**
```bash
# Apply catalogs to .yarnrc.yml
yarn catalogs apply

# Preview changes without writing
yarn catalogs apply --dry-run
```

**Options:**
- `--dry-run`: Show what would be applied without modifying `.yarnrc.yml`

**Notes:**
- Completely replaces `catalog` and `catalogs` fields in `.yarnrc.yml`
- Preserves all other settings in `.yarnrc.yml`
- Validates inheritance chains before applying
- Resolves all inheritance relationships into flat catalog definitions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
