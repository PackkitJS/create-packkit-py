import type { PyConfig } from './types.js';
import { defaultConfig } from './options.js';
import type { Baseline } from './baseline.js';

// packkit.json — what this Python project was generated from. Only settings that
// differ from the defaults are recorded, so it reads as the decisions actually
// made, plus a baseline (per-file hashes + pyproject snapshot) that powers
// baseline-aware `upgrade`. Deterministic and free of timestamps.
export function provenance(
	cfg: PyConfig,
	meta: { preset?: string; version?: string; baseline?: Baseline } = {},
): string {
	const defaults = defaultConfig() as Record<string, unknown>;
	const settings: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(cfg)) {
		if (key === 'name') continue; // transient — not a template decision
		if (!(key in defaults)) continue;
		if (JSON.stringify(value) !== JSON.stringify(defaults[key])) settings[key] = value;
	}

	const out = {
		$schema: 'https://packkitlabs.github.io/create-packkit-py/packkit.schema.json',
		generator: 'create-packkit-py',
		...(meta.version ? { version: meta.version } : {}),
		...(meta.preset ? { preset: meta.preset } : {}),
		settings,
		...(meta.baseline ? { baseline: meta.baseline } : {}),
	};
	return `${JSON.stringify(out, null, 2)}\n`;
}
