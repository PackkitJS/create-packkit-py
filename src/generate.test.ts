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

	it('omits the release workflow by default', () => {
		expect(Object.keys(generate({ name: 'x' }).files)).not.toContain(
			'.github/workflows/release.yml',
		);
	});

	it('release=pypi emits a Trusted-Publishing workflow (OIDC, no token) + README section', () => {
		const project = generate({ name: 'my-lib', release: 'pypi', pythonVersion: '3.12' });
		const wf = project.files['.github/workflows/release.yml'] ?? '';
		expect(wf).toContain('id-token: write');
		expect(wf).toContain('pypa/gh-action-pypi-publish@release/v1');
		expect(wf).toContain("python-version: '3.12'"); // threads the resolved pythonVersion floor
		expect(wf).not.toMatch(/NPM_TOKEN|PYPI_TOKEN|password/i);
		expect(project.files['README.md']).toContain('## Release');
		expect(project.files['README.md']).toContain('Trusted Publishing');
	});

	it('rejects an invalid release option', () => {
		expect(() => generate({ name: 'x', release: 'bogus' } as never)).toThrowError(
			/Unknown release "bogus"/,
		);
	});

	// Completeness: every project carries the checklist `all`-scope capabilities, so Python
	// is at parity with JS (see @packkit/core GENERATOR_CHECKLIST).
	it('emits the checklist parity files (editorconfig, CI, dependabot, community, agent guide)', () => {
		const files = Object.keys(generate({ name: 'demo' }).files);
		for (const path of [
			'.editorconfig',
			'.github/workflows/ci.yml',
			'.github/dependabot.yml',
			'CONTRIBUTING.md',
			'CODE_OF_CONDUCT.md',
			'SECURITY.md',
			'.github/ISSUE_TEMPLATE/bug_report.md',
			'.github/ISSUE_TEMPLATE/feature_request.md',
			'.github/PULL_REQUEST_TEMPLATE.md',
			'AGENTS.md',
			'CLAUDE.md',
		]) {
			expect(files, path).toContain(path);
		}
	});

	it('supports Apache-2.0 and ISC licenses', () => {
		expect(generate({ name: 'x', license: 'Apache-2.0' }).files['LICENSE']).toContain(
			'Apache License',
		);
		expect(generate({ name: 'x', license: 'ISC' }).files['LICENSE']).toContain('ISC License');
	});

	// Regression for #21: a long --description must not push any generated Python line
	// past ruff's line-length (100), or the scaffold fails its own `ruff check`.
	it('keeps every generated Python line ≤ 100 chars even with a very long description', () => {
		const description =
			'A delightfully thorough and rather verbose description that runs well past one ' +
			'hundred characters so the module docstring and the argparse description both have ' +
			'to wrap instead of overflowing.';
		for (const target of ['library', 'cli', 'worker', 'service'] as const) {
			const { files } = generate({ name: 'demo', target, description });
			for (const [path, body] of Object.entries(files)) {
				if (!path.endsWith('.py')) continue;
				const tooLong = body.split('\n').filter((l) => l.length > 100);
				expect(tooLong, `${target} ${path} has lines > 100`).toEqual([]);
			}
		}
	});
});
