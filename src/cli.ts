#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './generate.js';
import { writeGeneratedProject } from '@packkit/core/node';
import { PRESETS, PRESET_INFO, PRESET_NAMES, PRESET_ALIASES, resolvePreset } from './presets.js';
import { PackkitPyError } from './errors.js';
import type { PyConfigInput } from './types.js';

function selfVersion(): string {
	try {
		const pkg = JSON.parse(
			readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
		);
		return pkg.version ?? '0.0.0';
	} catch {
		return '0.0.0';
	}
}

const HELP = `create-packkit-py — scaffold a modern Python project (pyproject/uv, ruff, pytest, src layout)

Usage:
  npx create-packkit-py <preset> <name> [options]
  npm create packkit-py <preset> <name>

Presets:
${PRESET_NAMES.map((n) => `  ${n.padEnd(8)} ${PRESET_INFO[n]}`).join('\n')}
  aliases: ${Object.entries(PRESET_ALIASES)
		.map(([a, p]) => `${a}→${p}`)
		.join('  ')}

Options:
  --name <name>          Distribution name (or first/second positional)
  --description <text>
  --author "<name> <email>"
  --license <MIT|none>   (default: MIT)
  --python <3.x>         Minimum Python version (default: 3.11)
  --target <library|cli>
  --no-typecheck         Skip mypy config + dev dependency
  --here                 Scaffold into the current directory
  --force                Overwrite existing files
  -h, --help             Show this help          -v, --version`;

function run(argv: string[]): void {
	const { values, positionals } = parseArgs({
		args: argv,
		allowPositionals: true,
		options: {
			name: { type: 'string' },
			description: { type: 'string' },
			author: { type: 'string' },
			license: { type: 'string' },
			python: { type: 'string' },
			target: { type: 'string' },
			'no-typecheck': { type: 'boolean' },
			here: { type: 'boolean' },
			force: { type: 'boolean' },
			help: { type: 'boolean', short: 'h' },
			version: { type: 'boolean', short: 'v' },
		},
	});

	if (values.help) return void console.log(HELP);
	if (values.version) return void console.log(selfVersion());

	// A preset may appear in either positional slot; a leftover positional errors
	// (the same trap create-packkit's #43 fixed — silence is the real defect).
	const pos = [...positionals];
	let presetToken: string | undefined;
	const at = pos.findIndex((p) => resolvePreset(p));
	if (at !== -1) presetToken = pos.splice(at, 1)[0];
	const name = values.name ?? pos.shift();
	if (pos.length)
		throw new PackkitPyError(
			'UNKNOWN_ARG',
			`Unrecognized argument "${pos[0]}". Run \`create-packkit-py --help\`.`,
		);
	if (!name)
		throw new PackkitPyError(
			'MISSING_NAME',
			'A project name is required, e.g. `create-packkit-py py-lib my-lib`.',
		);

	const canonical = presetToken ? resolvePreset(presetToken) : undefined;
	const input: PyConfigInput = {
		...(canonical ? PRESETS[canonical] : {}),
		name,
		...(values.description != null ? { description: values.description } : {}),
		...(values.author != null ? { author: values.author } : {}),
		...(values.license != null ? { license: values.license as PyConfigInput['license'] } : {}),
		...(values.python != null ? { pythonVersion: values.python } : {}),
		...(values.target != null ? { target: values.target as PyConfigInput['target'] } : {}),
		...(values['no-typecheck'] ? { typecheck: false } : {}),
	};

	const project = generate(input, { preset: canonical, version: selfVersion() });
	const dir = values.here ? '.' : project.config.name;
	const { written, skipped } = writeGeneratedProject(dir, project.files, { force: !!values.force });

	console.log(
		`Created ${project.config.name} (${project.summary.target}) — ${written.length} files in ${dir === '.' ? 'the current directory' : `${dir}/`}`,
	);
	if (skipped.length)
		console.log(
			`Skipped ${skipped.length} existing file(s): ${skipped.join(', ')} (use --force to overwrite)`,
		);
	console.log('\nNext:');
	if (dir !== '.') console.log(`  cd ${dir}`);
	console.log('  uv sync --all-extras');
	console.log('  uv run pytest');
}

try {
	run(process.argv.slice(2));
} catch (err) {
	if (err instanceof PackkitPyError) {
		console.error(`✖ ${err.message}`);
		process.exit(1);
	}
	throw err;
}
