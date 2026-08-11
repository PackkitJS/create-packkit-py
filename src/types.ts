// Public types for create-packkit-py — a JS generator whose *output* is an
// idiomatic Python project (pyproject.toml, uv, ruff, pytest, src/ layout).
// Packkit's engine pattern; the emitted project is pure Python.

export type PyTarget = 'library' | 'cli';
export type PyLicense = 'MIT' | 'none';

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
}

export type PyConfigInput = Partial<PyConfig> & { name?: string };

export interface GeneratedPyProject {
	config: PyConfig;
	/** path → file contents. Deterministic: same config → same bytes. */
	files: Record<string, string>;
	summary: {
		distributionName: string;
		/** Importable module name (hyphens → underscores). */
		moduleName: string;
		target: PyTarget;
		fileCount: number;
	};
}
