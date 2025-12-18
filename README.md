# yarn-plugin-catalogs

A Yarn plugin that manages catalog definitions in `catalogs.yml` and delegates to Yarn's native Catalogs support (available since Yarn 4.10.0).

Highly inspired by [pnpm Catalogs](https://pnpm.io/catalogs).

## Why use this plugin?

Since Yarn 4.10.0, Yarn natively supports catalogs for managing dependency versions across your workspace. This plugin extends Yarn's native support by:

- **Managing catalogs in a separate `catalogs.yml` file** for better organization
- **Supporting hierarchical catalog inheritance** (e.g., `stable/canary` inherits from `stable`)
- **Providing validation** to ensure consistent catalog usage across workspaces
- **Auto-applying default catalogs** when adding dependencies

## Requirements

- **Yarn 4.10.0 or later** (for native catalog support)

## Installation

```bash
yarn plugin import https://raw.githubusercontent.com/toss/yarn-plugin-catalogs/main/bundles/%40yarnpkg/plugin-catalogs.js
```

## Usage

### 1. Create `catalogs.yml` in your project root

```yaml
# catalogs.yml

options:
  default: [stable]           # Optional: Default catalog groups for 'yarn add'
  validation: warn            # Optional: 'warn' | 'strict' | 'off'

list:
  root:  # Special alias for the root catalog (accessed via catalog:)
    lodash: npm:4.17.21

  stable:
    react: npm:18.0.0
    typescript: npm:5.1.0

  stable/canary:
    react: npm:18.2.0  # Overrides stable

  beta:
    react: npm:19.0.0
```

### 2. (Optional) Configure schema validation in VSCode

For better editing experience with `catalogs.yml`, you can enable schema validation in VSCode by adding the following to `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "https://raw.githubusercontent.com/toss/yarn-plugin-catalogs/refs/heads/main/sources/configuration/schema.json": "catalogs.yml"
  }
}
```

This will provide autocomplete and validation for your `catalogs.yml` file.

### 3. Apply catalogs to `.yarnrc.yml`

```bash
$ yarn catalogs apply
```

This command reads `catalogs.yml`, resolves all inheritance, and writes the flattened catalogs to `.yarnrc.yml`.

**Example output:**

```bash
$ yarn catalogs apply
➤ YN0000: stable:
➤ YN0000:   + react: npm:18.2.0
➤ YN0000:   - react: npm:18.0.0

➤ YN0000: ✓ Applied 1 named catalog group to .yarnrc.yml
➤ YN0000: Done in 0s 2ms
```

If there are no changes, you'll see:

```bash
$ yarn catalogs apply
➤ YN0000: No changes to apply - .yarnrc.yml is already up to date
➤ YN0000: Done in 0s 1ms
```

The generated `.yarnrc.yml` will look like:

```yaml
# .yarnrc.yml (generated - do not edit catalogs here)

catalog:
  lodash: npm:4.17.21

catalogs:
  stable:
    react: npm:18.0.0
    typescript: npm:5.1.0

  stable/canary:
    react: npm:18.2.0
    typescript: npm:5.1.0  # Inherited and resolved

  beta:
    react: npm:19.0.0
```

### 4. Use catalog protocol in package.json

```json
{
  "dependencies": {
    "lodash": "catalog:",                 // Uses root catalog
    "react": "catalog:stable",            // Uses stable catalog
    "typescript": "catalog:stable/canary" // Uses stable/canary catalog
  }
}
```

Yarn's native catalog resolution will automatically resolve these to the versions defined in `.yarnrc.yml`.

## Advanced Features

### Check Mode

Check if `.yarnrc.yml` is up to date with `catalogs.yml`:

```bash
$ yarn catalogs apply --check
```

This is useful in CI/CD pipelines to ensure catalogs are properly synchronized. The command will:
- Exit with code 0 if `.yarnrc.yml` is up to date
- Exit with code 1 and show a diff of changes if `.yarnrc.yml` is out of date

**Example output when changes are needed:**

```bash
$ yarn catalogs apply --check
➤ YN0000: .yarnrc.yml is out of date. Run 'yarn catalogs apply' to update it.

➤ YN0000: stable:
➤ YN0000:   + react: npm:18.2.0
➤ YN0000:   - react: npm:18.0.0

➤ YN0000: Would apply 1 named catalog group to .yarnrc.yml
➤ YN0000: Failed with errors in 0s 1ms
```

**Example output when up to date:**

```bash
$ yarn catalogs apply --check
➤ YN0000: ✓ .yarnrc.yml is up to date
➤ YN0000: Done in 0s 1ms
```

### Protocol Support

You can use any protocol supported by Yarn:

```yaml
# In catalogs.yml
list:
  stable:
    react: npm:18.0.0
    next: npm:13.4.9
    lodash: patch:lodash@4.17.21#./.patches/lodash.patch
```

### Scoped Packages

Scoped packages work as expected:

```yaml
# In catalogs.yml
list:
  stable:
    "@emotion/react": npm:11.11.1
    "@types/react": npm:18.2.15
    "@tanstack/react-query": npm:5.0.0
```

### Catalog Group Inheritance

Catalog groups can inherit from parent groups using the `/` delimiter:

```yaml
# In catalogs.yml
list:
  stable:
    react: npm:18.0.0
    lodash: npm:4.17.21
    typescript: npm:5.1.6

  stable/canary:
    react: npm:18.2.0       # Overrides parent version
    # lodash: npm:4.17.21   (inherited from stable)
    # typescript: npm:5.1.6 (inherited from stable)

  stable/canary/next:
    react: npm:18.3.1  # Overrides parent version
    # All other packages inherited from stable/canary
```

After running `yarn catalogs apply`, all inheritance is resolved and written to `.yarnrc.yml`.

### Default Catalogs

The `default` option in `catalogs.yml` automatically applies a catalog when running `yarn add`:

```yaml
# In catalogs.yml
options:
  default: [stable, root]

list:
  root:
    lodash: npm:4.17.21
  stable:
    react: npm:18.0.0
    typescript: npm:5.1.0
```

```bash
yarn add react       # Automatically uses catalog:stable
yarn add lodash      # Falls back to catalog: (root)
yarn add unknown-pkg # Normal installation (not in any catalog)
```

#### "max" Mode

Set `default: max` to automatically use the most frequently used catalog in the current workspace:

```yaml
# In catalogs.yml
options:
  default: max

list:
  stable:
    react: npm:18.0.0
    next: npm:14.0.0
  beta:
    react: npm:19.0.0
    next: npm:15.0.0
```

If your `package.json` has more `catalog:stable` dependencies than `catalog:beta`, running `yarn add next` will automatically use `catalog:stable`.

### Validation

Control how strictly catalog usage is enforced:

```yaml
# In catalogs.yml
options:
  validation: warn  # 'warn' | 'strict' | 'off'

list:
  stable:
    react: npm:18.0.0
```

- **`warn`** (default): Show warnings for dependencies that should use catalogs
- **`strict`**: Throw errors and prevent installation
- **`off`**: Disable validation entirely

#### Per-Catalog Validation

Set different validation levels for each catalog:

```yaml
# In catalogs.yml
options:
  validation:
    stable: strict    # Strictly enforce stable catalog
    beta: warn        # Warn for beta catalog
    experimental: off # No validation for experimental

list:
  stable:
    react: npm:18.0.0
  beta:
    react: npm:19.0.0-rc
  experimental:
    react: npm:19.0.0-alpha
```

**Validation Rules:**
- When a package exists in multiple catalogs, the strictest level applies (`strict` > `warn` > `off`)
- Hierarchical catalogs inherit validation settings from their parent groups:

```yaml
# In catalogs.yml
options:
  validation:
    stable: off           # Parent group has validation off
    stable/canary: strict # Child group enforces strictly

list:
  stable:
    react: npm:18.0.0
  stable/canary:
    react: npm:18.2.0
    lodash: npm:4.17.21
```

In this example:
- `react` will use `strict` validation (from `stable/canary`)
- `lodash` will use `strict` validation (from `stable/canary` since it's not in parent)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
