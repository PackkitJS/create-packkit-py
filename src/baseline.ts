// Scaffold-time baseline stored in packkit.json: a content hash per generated
// file plus the pyproject.toml structural snapshot. A later `upgrade` uses it to
// tell a template change from the user's own edit (three-way). Deterministic and
// version-independent — the same files always produce the same baseline.
import { contentHash } from '@packkit/core';
import { PROVENANCE_SCHEMA_VERSION } from './constants.js';
import { pyprojectDiffer } from './manifest-differ.js';
import type { PyprojectSnapshot } from './manifest-differ.js';

export interface Baseline {
	schemaVersion: number;
	files: Record<string, { hash: string }>;
	pyproject: PyprojectSnapshot;
}

const EMPTY_PYPROJECT: PyprojectSnapshot = { dependencies: [], devDependencies: [], scripts: {} };

/** Build the baseline from a fully-generated file map (excluding packkit.json,
 *  which holds the baseline). */
export function buildBaseline(files: Record<string, string>): Baseline {
	const fileHashes: Record<string, { hash: string }> = {};
	for (const path of Object.keys(files).sort()) {
		if (path === 'packkit.json') continue;
		fileHashes[path] = { hash: contentHash(files[path] ?? '') };
	}
	const pyproject = files['pyproject.toml']
		? (pyprojectDiffer.snapshot(
				pyprojectDiffer.parse(files['pyproject.toml']),
			) as unknown as PyprojectSnapshot)
		: EMPTY_PYPROJECT;
	return { schemaVersion: PROVENANCE_SCHEMA_VERSION, files: fileHashes, pyproject };
}

/** Read the baseline out of an on-disk packkit.json (or undefined if absent). */
export function readBaseline(packkitJson: string | undefined): Baseline | undefined {
	if (!packkitJson) return undefined;
	try {
		return (JSON.parse(packkitJson) as { baseline?: Baseline }).baseline;
	} catch {
		return undefined;
	}
}
