// End-to-end integration: scaffold each preset with the REAL built CLI, then set
// the project up with uv and run its own tooling (pytest, ruff, mypy) — and, for a
// CLI target, actually execute the console script. This is the reference
// implementation of the `test:integration` contract that PackkitLabs/packkit-actions'
// generator-integration workflow invokes; every generator repo implements the same
// script name, the shared workflow stays language-agnostic.
//
// uv manages its own Python (auto-downloads a matching interpreter), so the host's
// system Python version is irrelevant. Usage: `node scripts/integration.mjs [preset...]`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'cli.js');
const ALL_PRESETS = ['py-lib', 'py-cli', 'py-worker'];
const presets = process.argv.slice(2).length ? process.argv.slice(2) : ALL_PRESETS;

// dist name for a project scaffolded as `<preset>-demo` (naming lowercases/hyphenates).
const distName = (preset) => `${preset}-demo`;

function sh(cmd, args, cwd) {
	process.stdout.write(`\n$ ${cmd} ${args.join(' ')}   (${cwd})\n`);
	execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

function integrate(preset) {
	const workdir = mkdtempSync(join(tmpdir(), `packkit-py-${preset}-`));
	const name = distName(preset);
	try {
		console.log(`\n=== integration: ${preset} → ${name} ===`);
		// 1. Scaffold with the real CLI (writes ./<name>/ under workdir).
		sh(process.execPath, [CLI, preset, name], workdir);
		const project = join(workdir, name);

		// 2. Install the project + dev extras into an isolated uv venv (auto-fetches Python).
		sh('uv', ['sync', '--all-extras'], project);

		// 3. Run the generated project's own quality gate.
		sh('uv', ['run', 'pytest'], project);
		sh('uv', ['run', 'ruff', 'check', '.'], project);
		sh('uv', ['run', 'mypy'], project); // typecheck is on by default for both presets

		// 4. For a CLI, the console script must actually run and greet.
		if (preset === 'py-cli') {
			const out = execFileSync('uv', ['run', name, 'there'], { cwd: project, encoding: 'utf8' });
			if (!out.includes('Hello, there!')) {
				throw new Error(`CLI output did not greet as expected. Got: ${JSON.stringify(out)}`);
			}
			console.log(`  ✓ console script greeted: ${out.trim()}`);
		}
		console.log(`=== ${preset}: PASS ===`);
	} finally {
		rmSync(workdir, { recursive: true, force: true });
	}
}

let failed = false;
for (const preset of presets) {
	try {
		integrate(preset);
	} catch (err) {
		failed = true;
		console.error(`\n✖ ${preset} FAILED: ${err.message}`);
	}
}
if (failed) {
	console.error('\nintegration: one or more presets failed');
	process.exit(1);
}
console.log('\nintegration: all presets passed');
