# Changelog

All notable changes to `create-packkit-py` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/PackkitJS/create-packkit-py/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/PackkitJS/create-packkit-py/releases/tag/v1.0.0
[0.1.0]: https://github.com/PackkitJS/create-packkit-py/releases/tag/v0.1.0
