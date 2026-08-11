import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { PackkitPyError } from './errors.js';

/** Write a generated file map to disk. Never overwrites existing files unless
 *  `force` is set — a collision is reported, not silently clobbered. */
export function writeProject(dir: string, files: Record<string, string>, opts: { force?: boolean } = {}): { written: string[]; skipped: string[] } {
	const root = resolve(dir);
	const written: string[] = [];
	const skipped: string[] = [];

	for (const [rel, content] of Object.entries(files)) {
		const abs = join(root, rel);
		// Path safety: a template path must never escape the target directory.
		if (abs !== root && !abs.startsWith(root + sep)) {
			throw new PackkitPyError('UNSAFE_PATH', `Refusing to write outside the target directory: "${rel}".`);
		}
		if (existsSync(abs) && !opts.force) {
			skipped.push(rel);
			continue;
		}
		mkdirSync(dirname(abs), { recursive: true });
		writeFileSync(abs, content);
		written.push(rel);
	}
	return { written: written.sort(), skipped: skipped.sort() };
}
