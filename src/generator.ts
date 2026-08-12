import { PACKKIT_PROTOCOL_VERSION } from '@packkit/core';
import type {
	GeneratedProject,
	GeneratorSchema,
	ManifestDiffer,
	PackkitGenerator,
	PresetDescriptor,
	ProjectDefinition,
} from '@packkit/core';
import { GENERATOR_ID, PROVENANCE_SCHEMA_VERSION } from './constants.js';
import { PRESETS, PRESET_INFO, PRESET_NAMES, resolvePreset } from './presets.js';
import { generate } from './generate.js';
import { pyprojectDiffer } from './manifest-differ.js';
import { upgradeProject, type UpgradeInput } from './upgrade.js';
import type { PyConfigInput } from './types.js';

// Injected at build time by tsup/vitest `define` (see tsup.config.ts). Read from a
// constant, never package.json at runtime, so the generator stays browser-safe
// (no node:fs) and can be bundled into packkit-web. The typeof guard keeps it from
// throwing if some tool bundles this without defining the constant.
declare const __PACKKIT_PY_VERSION__: string;
const VERSION = typeof __PACKKIT_PY_VERSION__ === 'string' ? __PACKKIT_PY_VERSION__ : '0.0.0';

// create-packkit-py implemented as a @packkit/core PackkitGenerator. Since generate()
// already returns protocol-native output (metadata + deployment contract), the base
// project IS a core GeneratedProject; this adapter adds identity, capabilities,
// preset/schema discovery, and the { preset, name, config } input convention.
export const pythonGenerator: PackkitGenerator = {
	id: GENERATOR_ID,
	language: 'python',
	version: VERSION,
	maturity: 'stable',
	protocol: {
		version: PACKKIT_PROTOCOL_VERSION,
		capabilities: ['generate', 'deployment-contract', 'project-definition', 'baseline-upgrade'],
	},

	// The contract's array defaults each differ's Diff to the generic
	// ManifestDiffResult; pyprojectDiffer returns its own richer PyprojectDiff, so
	// widen here (its precise type is still exported for direct consumers). The
	// cast goes away once core's field is generalized to ManifestDiffer<unknown, unknown>[].
	manifestDiffers: [pyprojectDiffer as unknown as ManifestDiffer],

	listPresets(): PresetDescriptor[] {
		return PRESET_NAMES.map((id) => ({ id, description: PRESET_INFO[id], maturity: 'stable' }));
	},

	getSchema(): GeneratorSchema {
		return {
			schemaVersion: PROVENANCE_SCHEMA_VERSION,
			generatorId: GENERATOR_ID,
			options: [
				{ id: 'name', description: 'PyPI distribution name (hyphenated ok)' },
				{ id: 'description' },
				{ id: 'author', description: '"Name <email>"' },
				{ id: 'license', choices: ['MIT', 'none'], default: 'MIT' },
				{ id: 'target', choices: ['library', 'cli'], default: 'library' },
				{ id: 'pythonVersion', default: '3.11', description: 'Minimum Python version' },
				{ id: 'typecheck', default: true, description: 'mypy strict config + dev dep' },
			],
		};
	},

	createProject(input): GeneratedProject {
		const { preset, name, config } = (input ?? {}) as {
			preset?: string;
			name?: string;
			config?: PyConfigInput;
		};
		const canonical = preset ? resolvePreset(preset) : undefined;
		const pyInput: PyConfigInput = {
			...(canonical ? PRESETS[canonical] : {}),
			...(config ?? {}),
			...(name ? { name } : {}),
		};
		const project = generate(pyInput, { preset: canonical, version: VERSION });
		// GeneratedPyProject IS a core GeneratedProject; only widen the strict PyConfig
		// to the contract's Record<string, unknown> (every other field is checked).
		return { ...project, config: project.config as unknown as Record<string, unknown> };
	},

	// A definition is just the resolved config + preset; replaying it re-runs
	// generate(), which is deterministic, so the output round-trips exactly.
	exportDefinition(project): ProjectDefinition {
		return {
			schemaVersion: PROVENANCE_SCHEMA_VERSION,
			protocolVersion: PACKKIT_PROTOCOL_VERSION,
			generator: { id: GENERATOR_ID, version: VERSION },
			preset: project.metadata.preset,
			config: project.config,
		};
	},

	createProjectFromDefinition(definition): GeneratedProject {
		const project = generate(definition.config as PyConfigInput, {
			preset: definition.preset,
			version: VERSION,
		});
		return { ...project, config: project.config as unknown as Record<string, unknown> };
	},

	// Baseline-aware re-generation: replays the definition and three-way diffs
	// files (and pyproject.toml) against the stored baseline, so template updates
	// and user edits are told apart. Pure — reports the plan, applies nothing.
	upgradeProject(input) {
		return upgradeProject({ ...(input as UpgradeInput), version: VERSION });
	},
};
