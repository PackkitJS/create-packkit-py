---
'create-packkit-py': major
---

Bring the Python generator to universal-embedding parity on `@packkit/core@0.2.0`, so a host drives a Python project's lifecycle exactly like any other language.

- **`upgradeProject` now returns the common `UpgradeResult` envelope** (`{ generatedProject, plan, patch, diagnostics, metadata }`) — the universal file-change vocabulary from core, with the pyproject.toml structural diff attached as `plan.manifest`. **Breaking:** the previous `{ files, pyproject, baselineAvailable }` shape and the `UpgradePlan`/`FileChange` type exports are removed.
- **Host file extensions** (add/replace) now survive definition export → replay: `exportDefinition` persists `extensions` and `createProjectFromDefinition` re-applies them via core's `extendGeneratedProject`.
- **Uses the canonical Node writer** (`@packkit/core/node`) — the duplicate `src/write.ts` is gone.
- Passes `@packkit/core`'s **embedded lifecycle conformance suite** (digest stability, replay determinism, extension survival, common upgrade envelope) alongside the generation suite.

Deterministic identity digests come free via `calculateGeneratedProjectDigest` in core. Python-specific concerns (pyproject.toml, uv, ruff, pytest, mypy, naming) stay inside this generator.
