import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PACKKIT_PROTOCOL_VERSION } from '@packkit/core';
import type {
	GeneratedProject,
	GeneratorSchema,
	PackkitGenerator,
	PresetDescriptor,
} from '@packkit/core';
import { GENERATOR_ID, PROVENANCE_SCHEMA_VERSION } from './constants.js';
import { PRESETS, PRESET_INFO, PRESET_NAMES, resolvePreset } from './presets.js';
import { generate } from './generate.js';
import type { PyConfigInput } from './types.js';

function selfVersion(): string {
	try {
		return (
			JSON.parse(
				readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
			).version ?? '0.0.0'
		);
	} catch {
		return '0.0.0';
	}
}

const VERSION = selfVersion();

// create-packkit-py implemented as a @packkit/core PackkitGenerator. Since generate()
// already returns protocol-native output (metadata + deployment contract), the base
// project IS a core GeneratedProject; this adapter adds identity, capabilities,
// preset/schema discovery, and the { preset, name, config } input convention.
export const pythonGenerator: PackkitGenerator = {
	id: GENERATOR_ID,
	language: 'python',
	version: VERSION,
	maturity: 'preview',
	protocol: {
		version: PACKKIT_PROTOCOL_VERSION,
		capabilities: ['generate', 'deployment-contract'],
	},

	listPresets(): PresetDescriptor[] {
		return PRESET_NAMES.map((id) => ({ id, description: PRESET_INFO[id], maturity: 'preview' }));
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
};
