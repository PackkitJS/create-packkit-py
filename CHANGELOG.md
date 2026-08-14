# create-packkit-py

## 2.1.1

### Patch Changes

- 475b885: Consume `@packkit/core@^0.4.0` (which generalizes the `node-service` deployment type to
  the language-neutral `service`). No functional change — the Python generator emits only
  `library`/`cli`/`worker` contracts — this keeps the whole ecosystem on one core line so a
  multi-generator host (packkit-mcp, packkit-web) never resolves a split core.

## 2.1.0

### Minor Changes

- dd98080: Add a **`py-worker`** target/preset — a transport-agnostic background worker (Phase 7, on `@packkit/core`'s `WorkerDeploymentContract`). Emits a unit-testable `handle()` seam, a runner that drains in-flight work on `SIGTERM`/`SIGINT` and exits 0, structured JSON stdout logs, a poison-message seam with bounded retries, env-based config (`WORKER_MAX_ATTEMPTS`/`WORKER_LOG_LEVEL`), a `python -m` entry point, and a Dockerfile with **no** `EXPOSE`/HTTP healthcheck (liveness is the process). No transport SDK is baked in — wire `receive()` to your queue. The generated project's own pytest proves the SIGTERM drain exits 0; `deriveDeploymentContract` returns a `worker` contract. `library`/`cli` unchanged.

## 2.0.0

### Major Changes

- 2cd5eef: Bring the Python generator to universal-embedding parity on `@packkit/core@0.2.0`, so a host drives a Python project's lifecycle exactly like any other language.

  - **`upgradeProject` now returns the common `UpgradeResult` envelope** (`{ generatedProject, plan, patch, diagnostics, metadata }`) — the universal file-change vocabulary from core, with the pyproject.toml structural diff attached as `plan.manifest`. **Breaking:** the previous `{ files, pyproject, baselineAvailable }` shape and the `UpgradePlan`/`FileChange` type exports are removed.
  - **Host file extensions** (add/replace) now survive definition export → replay: `exportDefinition` persists `extensions` and `createProjectFromDefinition` re-applies them via core's `extendGeneratedProject`.
  - **Uses the canonical Node writer** (`@packkit/core/node`) — the duplicate `src/write.ts` is gone.
  - Passes `@packkit/core`'s **embedded lifecycle conformance suite** (digest stability, replay determinism, extension survival, common upgrade envelope) alongside the generation suite.

  Deterministic identity digests come free via `calculateGeneratedProjectDigest` in core. Python-specific concerns (pyproject.toml, uv, ruff, pytest, mypy, naming) stay inside this generator.

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
