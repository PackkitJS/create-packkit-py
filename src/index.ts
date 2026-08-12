// Public API for create-packkit-py — a JS generator whose output is a Python
// project. Consumed by the CLI, the (future) web configurator, and the shared
// packkit-mcp server, exactly as create-packkit's core is.
export { generate } from './generate.js';
export { normalizeConfig, defaultConfig } from './options.js';
export { PRESETS, PRESET_NAMES, PRESET_ALIASES, PRESET_INFO, resolvePreset } from './presets.js';
export { distributionName, moduleName } from './naming.js';
export { deriveDeploymentContract } from './deployment.js';
export { PackkitPyError } from './errors.js';
export { GENERATOR_ID } from './constants.js';
// create-packkit-py as a @packkit/core PackkitGenerator (the platform interface).
export { pythonGenerator } from './generator.js';
// Baseline-aware upgrade surface: the pyproject.toml ManifestDiffer and the
// three-way upgrade planner (also reachable via pythonGenerator.upgradeProject).
export { pyprojectDiffer } from './manifest-differ.js';
export type {
	PyprojectManifest,
	PyprojectSnapshot,
	PyprojectDiff,
	DepAddition,
	ScriptChange,
} from './manifest-differ.js';
export { buildBaseline, readBaseline } from './baseline.js';
export type { Baseline } from './baseline.js';
export { upgradeProject } from './upgrade.js';
export type { UpgradeInput, UpgradePlan, FileChange } from './upgrade.js';
export type * from './types.js';
