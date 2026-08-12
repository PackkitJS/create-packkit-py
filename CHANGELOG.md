# create-packkit-py

## 1.0.3

### Patch Changes

- e52f46d: Make the package browser-safe: the generator no longer reads `package.json` via `node:fs` at runtime (its version is injected at build time), so `create-packkit-py` can be bundled for the browser — e.g. by `packkit-web`. The CLI entry is unchanged.

## 1.0.2

### Patch Changes

- 1380331: Add a template-dependency freshness check (`check:freshness` — compares the PyPI deps the generator emits to the latest published) wired to the shared `dependency-freshness@v1` weekly workflow, and bring the emitted dev-tool floors current: `pytest>=9` and `mypy>=2` (verified by integration on real uv/pytest/mypy).

## 1.0.1

### Patch Changes

- 5c11d9f: Adopt the shared PackkitJS/packkit-actions CI. Runs `generator-ci@v1` via a standard `check` script; adds end-to-end integration tests through `generator-integration@v1` (scaffold each preset with the real CLI, then `uv sync` + pytest/ruff/mypy, and execute the console script for `py-cli`); adds a `security@v1` npm-audit gate. No runtime changes to the generated output.

## [1.0.0] - 2026-08-12

First public npm release. `create-packkit-py` is now a conformance-complete
`@packkit/core` generator (maturity `stable`) — it advertises every protocol
capability, including baseline-aware `upgrade`, and passes the full
`runGeneratorConformanceSuite`. (`0.1.0` was an internal milestone, never
published to npm.)

### Added

- **Baseline-aware `upgrade`.** `pythonGenerator` now advertises the
  `baseline-upgrade` capability and implements `upgradeProject`. `packkit.json`
  records a deterministic baseline (per-file content hashes plus a
  `pyproject.toml` structural snapshot), so a later upgrade tells a template
  change apart from your own edits via a three-way diff and never clobbers local
  work. Exposed as `upgradeProject`, `buildBaseline`, `readBaseline`.
- **`pyproject.toml` `ManifestDiffer`.** Python packaging semantics
  (`[project]` dependencies, `optional-dependencies.dev`, entry-point scripts,
  `requires-python`) live in a first-class `@packkit/core` `ManifestDiffer`
  (`pyprojectDiffer`, exposed on `pythonGenerator.manifestDiffers`) — keeping
  TOML and Python concepts out of core. Backed by `smol-toml`.

### Changed

- Maturity raised from `preview` to `stable`; presets report `stable`.
- `@packkit/core` bumped to `^0.1.1`.

[1.0.0]: https://github.com/PackkitJS/create-packkit-py/releases/tag/v1.0.0
[0.1.0]: https://github.com/PackkitJS/create-packkit-py/releases/tag/v0.1.0
