import { PackkitPyError } from './errors.js';

// PyPI distribution names allow hyphens; Python import names do not. A project
// named `my-lib` installs as `my-lib` but imports as `my_lib`. We derive the
// module name deterministically and validate both.

const DIST_NAME = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/;

/** Normalize a raw name to a valid lower-case PyPI distribution name. */
export function distributionName(raw: string): string {
	const name = raw.trim().toLowerCase();
	if (!DIST_NAME.test(name)) {
		throw new PackkitPyError(
			'INVALID_NAME',
			`"${raw}" is not a valid Python distribution name (lower-case letters, digits, and . _ - ; must start/end alphanumeric).`,
		);
	}
	return name;
}

/** The importable module name for a distribution: separators → underscores. */
export function moduleName(distribution: string): string {
	return distribution.replace(/[-.]+/g, '_');
}
