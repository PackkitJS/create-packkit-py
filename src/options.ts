import type { PyConfig, PyConfigInput, PyLicense, PyRelease, PyTarget } from './types.js';
import { PackkitPyError } from './errors.js';

/** Baseline config — every field an explicit, documented default. */
export function defaultConfig(): Omit<PyConfig, 'name'> {
	return {
		description: '',
		author: '',
		license: 'MIT',
		target: 'library',
		pythonVersion: '3.11',
		typecheck: true,
		release: 'none',
	};
}

const TARGETS: PyTarget[] = ['library', 'cli', 'worker', 'service'];
const LICENSES: PyLicense[] = ['MIT', 'none'];
const RELEASES: PyRelease[] = ['none', 'pypi'];

/** Merge input over defaults and validate enum fields. Name is required. */
export function normalizeConfig(input: PyConfigInput): PyConfig {
	if (!input.name) throw new PackkitPyError('MISSING_NAME', 'A project name is required.');
	const cfg: PyConfig = { ...defaultConfig(), name: input.name };

	for (const key of ['description', 'author', 'name'] as const) {
		if (input[key] != null) cfg[key] = input[key] as string;
	}
	if (input.pythonVersion != null) cfg.pythonVersion = String(input.pythonVersion);
	if (input.typecheck != null) cfg.typecheck = Boolean(input.typecheck);
	if (input.target != null) {
		if (!TARGETS.includes(input.target))
			throw new PackkitPyError(
				'INVALID_TARGET',
				`Unknown target "${input.target}". Expected one of: ${TARGETS.join(', ')}.`,
			);
		cfg.target = input.target;
	}
	if (input.license != null) {
		if (!LICENSES.includes(input.license))
			throw new PackkitPyError(
				'INVALID_LICENSE',
				`Unknown license "${input.license}". Expected one of: ${LICENSES.join(', ')}.`,
			);
		cfg.license = input.license;
	}
	if (input.release != null) {
		if (!RELEASES.includes(input.release))
			throw new PackkitPyError(
				'INVALID_RELEASE',
				`Unknown release "${input.release}". Expected one of: ${RELEASES.join(', ')}.`,
			);
		cfg.release = input.release;
	}
	if (!/^3\.\d{1,2}$/.test(cfg.pythonVersion)) {
		throw new PackkitPyError(
			'INVALID_PYTHON_VERSION',
			`"${cfg.pythonVersion}" is not a supported Python version (expected e.g. 3.11).`,
		);
	}
	return cfg;
}
