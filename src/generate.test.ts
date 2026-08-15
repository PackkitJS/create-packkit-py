import { describe, it, expect } from 'vitest';
import { generate } from './generate.js';

describe('generate', () => {
	it('scaffolds a py-lib with a src/ layout, pyproject, tests, py.typed', () => {
		const project = generate({ name: 'my-lib', target: 'library', description: 'A lib' });
		expect(project.summary.moduleName).toBe('my_lib');
		const paths = Object.keys(project.files);
		expect(paths).toContain('pyproject.toml');
		expect(paths).toContain('src/my_lib/__init__.py');
		expect(paths).toContain('src/my_lib/py.typed');
		expect(paths).toContain('tests/test_my_lib.py');
		expect(paths).toContain('LICENSE');
		expect(paths).toContain('packkit.json');
		// a library has no CLI entry point
		expect(paths).not.toContain('src/my_lib/__main__.py');

		const toml = project.files['pyproject.toml'] ?? '';
		expect(toml).toContain('name = "my-lib"');
		expect(toml).toContain('requires-python = ">=3.11"');
		expect(toml).toContain('build-backend = "hatchling.build"');
		expect(toml).toContain('[tool.ruff]');
		expect(toml).toContain('[tool.mypy]');
		expect(toml).not.toContain('[project.scripts]');
	});

	it('adds an argparse __main__ and a console script for py-cli', () => {
		const project = generate({ name: 'my-cli', target: 'cli' });
		expect(Object.keys(project.files)).toContain('src/my_cli/__main__.py');
		const toml = project.files['pyproject.toml'] ?? '';
		expect(toml).toContain('[project.scripts]');
		expect(toml).toContain('my-cli = "my_cli.__main__:main"');
	});

	it('is deterministic — same config, same bytes', () => {
		expect(generate({ name: 'x', description: 'd' }).files).toEqual(
			generate({ name: 'x', description: 'd' }).files,
		);
	});

	it('--no-typecheck drops mypy entirely', () => {
		const toml = generate({ name: 'x', typecheck: false }).files['pyproject.toml'] ?? '';
		expect(toml).not.toContain('mypy');
		expect(toml).not.toContain('[tool.mypy]');
	});

	it('records generator, preset, version, and settings in packkit.json', () => {
		const project = generate(
			{ name: 'my-cli', target: 'cli' },
			{ preset: 'py-cli', version: '0.1.0' },
		);
		const prov = JSON.parse(project.files['packkit.json'] ?? '{}');
		expect(prov.generator).toBe('create-packkit-py');
		expect(prov.preset).toBe('py-cli');
		expect(prov.version).toBe('0.1.0');
		expect(prov.settings.target).toBe('cli');
	});

	it('omits LICENSE when license is none', () => {
		expect(Object.keys(generate({ name: 'x', license: 'none' }).files)).not.toContain('LICENSE');
	});

	it('rejects an invalid distribution name', () => {
		expect(() => generate({ name: 'Bad Name!' })).toThrowError(
			/not a valid Python distribution name/,
		);
	});
});
