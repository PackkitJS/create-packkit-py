// Public types for create-packkit-py — a JS generator whose *output* is an
// idiomatic Python project (pyproject.toml, uv, ruff, pytest, src/ layout).
// Packkit's engine pattern; the emitted project is pure Python.

import type { Diagnostic, GeneratedProjectMetadata, DeploymentContract } from '@packkit/core';

export type PyTarget = 'library' | 'cli' | 'worker' | 'service';
export type PyLicense = 'MIT' | 'none';
/** Release automation. `pypi` = a PyPI Trusted-Publishing (OIDC) release workflow. */
export type PyRelease = 'none' | 'pypi';

/** Resolved configuration for one generated Python project. */
export interface PyConfig {
	/** Distribution (PyPI) name, e.g. `my-lib`. Hyphenated is fine. */
	name: string;
	description: string;
	author: string;
	license: PyLicense;
	target: PyTarget;
	/** Minimum Python, e.g. `3.11`. */
	pythonVersion: string;
	/** Add mypy (strict) config + a dev dependency. */
	typecheck: boolean;
	/** Release automation to scaffold (`none`, or a PyPI Trusted-Publishing workflow). */
	release: PyRelease;
}

export type PyConfigInput = Partial<PyConfig> & { name?: string };

// A generated Python project — a @packkit/core GeneratedProject (protocol-native
// metadata + deployment contract) plus a Python-specific `summary`.
export interface GeneratedPyProject {
	config: PyConfig;
	/** path → file contents. Deterministic: same config → same bytes. */
	files: Record<string, string>;
	diagnostics: Diagnostic[];
	metadata: GeneratedProjectMetadata;
	deploymentContract: DeploymentContract;
	summary: {
		distributionName: string;
		/** Importable module name (hyphens → underscores). */
		moduleName: string;
		target: PyTarget;
		fileCount: number;
	};
}
