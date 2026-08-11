// Public API for create-packkit-py — a JS generator whose output is a Python
// project. Consumed by the CLI, the (future) web configurator, and the shared
// packkit-mcp server, exactly as create-packkit's core is.
export { generate } from './generate.js';
export { normalizeConfig, defaultConfig } from './options.js';
export { PRESETS, PRESET_NAMES, PRESET_ALIASES, PRESET_INFO, resolvePreset } from './presets.js';
export { distributionName, moduleName } from './naming.js';
export { PackkitPyError } from './errors.js';
export type * from './types.js';
