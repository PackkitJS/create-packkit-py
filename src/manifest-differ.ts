// The pyproject.toml ManifestDiffer — create-packkit-py's manifest semantics as a
// first-class @packkit/core ManifestDiffer. This is the seam the platform keeps
// per-generator: core does the file-level three-way diff; Python's [project]
// dependencies / optional-dependencies / entry-points semantics live here, never
// in core (which knows nothing of TOML or Python packaging).
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';
import { classifyChange } from '@packkit/core';
import type { ChangeClassification, ManifestDiffer } from '@packkit/core';

export interface PyprojectManifest {
	project?: {
		dependencies?: string[];
		'optional-dependencies'?: Record<string, string[]>;
		scripts?: Record<string, string>;
		'requires-python'?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

/** Structural snapshot stored in the baseline for later three-way diffing. */
export interface PyprojectSnapshot {
	dependencies: string[];
	devDependencies: string[];
	scripts: Record<string, string>;
	requiresPython?: string;
}

export interface DepAddition {
	value: string;
	/** New template dep → safe; re-adding one the user removed → not safe. */
	safeToApply: boolean;
}
export interface ScriptChange extends ChangeClassification {
	current: string;
	generated: string;
}
export interface PyprojectDiff {
	addedDependencies: DepAddition[];
	addedDevDependencies: DepAddition[];
	addedScripts: Record<string, string>;
	changedScripts: Record<string, ScriptChange>;
}

function snapshotOf(manifest: PyprojectManifest): PyprojectSnapshot {
	const project = manifest.project ?? {};
	return {
		dependencies: [...(project.dependencies ?? [])],
		devDependencies: [...(project['optional-dependencies']?.dev ?? [])],
		scripts: { ...(project.scripts ?? {}) },
		requiresPython: project['requires-python'],
	};
}

function addedDeps(current: string[], generated: string[], baseline: string[]): DepAddition[] {
	const cur = new Set(current);
	const base = new Set(baseline);
	return generated
		.filter((dep) => !cur.has(dep))
		.map((value) => ({ value, safeToApply: !base.has(value) }));
}

export const pyprojectDiffer: ManifestDiffer<PyprojectManifest, PyprojectDiff> = {
	filename: 'pyproject.toml',
	parse: (content) => parseToml(content) as PyprojectManifest,
	serialize: (manifest) => `${stringifyToml(manifest)}\n`,
	snapshot: (manifest) => snapshotOf(manifest) as unknown as Record<string, unknown>,

	diff({ baseline, current, generated }) {
		const base = baseline as unknown as PyprojectSnapshot | undefined;
		const cur = snapshotOf(current);
		const gen = snapshotOf(generated);

		const addedScripts: Record<string, string> = {};
		const changedScripts: Record<string, ScriptChange> = {};
		for (const [name, target] of Object.entries(gen.scripts)) {
			const currentTarget = cur.scripts[name];
			if (currentTarget === undefined) {
				addedScripts[name] = target;
			} else if (currentTarget !== target) {
				const b = base?.scripts?.[name];
				changedScripts[name] = {
					current: currentTarget,
					generated: target,
					...classifyChange({
						hasBaseline: b !== undefined,
						currentEqualsBaseline: currentTarget === b,
						generatedEqualsBaseline: target === b,
					}),
				};
			}
		}

		return {
			addedDependencies: addedDeps(cur.dependencies, gen.dependencies, base?.dependencies ?? []),
			addedDevDependencies: addedDeps(
				cur.devDependencies,
				gen.devDependencies,
				base?.devDependencies ?? [],
			),
			addedScripts,
			changedScripts,
		};
	},
};
