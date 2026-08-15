// Characterization safety net (Platform migration, Phase 1 / #49).
// A full snapshot of every file each preset generates, so any refactor/extraction
// that changes generated output fails loudly. Update intentionally with `-u`.
//
// No version is passed to generate(), so packkit.json carries no `version` field
// and the snapshot stays independent of the tool's release version.
import { describe, it, expect } from 'vitest';
import { generate } from './generate.js';
import { PRESET_NAMES, PRESETS } from './presets.js';

const FIXED = { author: 'Fixture Author <fixture@example.com>', description: 'A fixture project.' };

describe('characterization: preset output is byte-stable', () => {
	for (const preset of PRESET_NAMES) {
		it(`${preset} matches its snapshot`, () => {
			const input = { ...(PRESETS[preset] ?? {}), name: 'fixture', ...FIXED };
			const { files } = generate(input, { preset });
			const sorted = Object.fromEntries(
				Object.keys(files)
					.sort()
					.map((path) => [path, files[path]]),
			);
			expect(sorted).toMatchSnapshot();
		});
	}

	it('generation is deterministic', () => {
		expect(generate({ ...(PRESETS['py-cli'] ?? {}), name: 'x' }).files).toEqual(
			generate({ ...(PRESETS['py-cli'] ?? {}), name: 'x' }).files,
		);
	});
});
