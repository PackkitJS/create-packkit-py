// Baseline-aware upgrade planning: regenerate from a stored definition, then a
// three-way diff of every file (baseline vs on-disk vs freshly-generated) plus the
// structured pyproject.toml diff. Pure — reports what changed and what is safe to
// apply; writing is the host's decision. Mirrors create-packkit's upgrade model.
import { classifyChange, contentHash } from '@packkit/core';
import type { ChangeClassification, ProjectDefinition } from '@packkit/core';
import { generate } from './generate.js';
import { readBaseline } from './baseline.js';
import { pyprojectDiffer } from './manifest-differ.js';
import type { PyprojectDiff } from './manifest-differ.js';
import type { GeneratedPyProject, PyConfigInput } from './types.js';

export interface FileChange extends ChangeClassification {
	path: string;
}

export interface UpgradeInput {
	definition: ProjectDefinition;
	currentFiles: Record<string, string>;
	version?: string;
}

export interface UpgradePlan {
	generatedProject: GeneratedPyProject;
	files: { added: string[]; changed: FileChange[]; unchanged: string[] };
	pyproject: PyprojectDiff;
	baselineAvailable: boolean;
}

export function upgradeProject(input: UpgradeInput): UpgradePlan {
	const { definition, currentFiles } = input;
	const generated = generate(definition.config as PyConfigInput, {
		preset: definition.preset,
		version: input.version,
	});
	const baseline = readBaseline(currentFiles['packkit.json']);

	const added: string[] = [];
	const changed: FileChange[] = [];
	const unchanged: string[] = [];
	for (const [path, content] of Object.entries(generated.files)) {
		if (path === 'packkit.json') continue; // provenance is refreshed, not diffed
		const current = currentFiles[path];
		if (current === undefined) {
			added.push(path);
		} else if (current === content) {
			unchanged.push(path);
		} else {
			const baseHash = baseline?.files?.[path]?.hash;
			changed.push({
				path,
				...classifyChange({
					hasBaseline: baseHash !== undefined,
					currentEqualsBaseline: contentHash(current) === baseHash,
					generatedEqualsBaseline: contentHash(content) === baseHash,
				}),
			});
		}
	}

	const pyproject = pyprojectDiffer.diff({
		baseline: baseline?.pyproject as unknown as Record<string, unknown> | undefined,
		current: pyprojectDiffer.parse(currentFiles['pyproject.toml'] ?? ''),
		generated: pyprojectDiffer.parse(generated.files['pyproject.toml'] ?? ''),
	});

	return {
		generatedProject: generated,
		files: {
			added: added.sort(),
			changed: changed.sort((a, b) => a.path.localeCompare(b.path)),
			unchanged: unchanged.sort(),
		},
		pyproject,
		baselineAvailable: baseline !== undefined,
	};
}
