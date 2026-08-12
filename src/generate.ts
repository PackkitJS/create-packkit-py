import { PACKKIT_PROTOCOL_VERSION } from '@packkit/core';
import type { GeneratedPyProject, PyConfig, PyConfigInput } from './types.js';
import { GENERATOR_ID, PROVENANCE_SCHEMA_VERSION } from './constants.js';
import { normalizeConfig } from './options.js';
import { distributionName, moduleName } from './naming.js';
import { provenance } from './provenance.js';
import { buildBaseline } from './baseline.js';
import { deriveDeploymentContract } from './deployment.js';
import { licenseText } from './license.js';

/** Generate a Python project in memory. Deterministic: same config → same bytes. */
export function generate(
	input: PyConfigInput,
	options: { preset?: string; version?: string } = {},
): GeneratedPyProject {
	const config = normalizeConfig(input);
	const dist = distributionName(config.name);
	const mod = moduleName(dist);
	const isCli = config.target === 'cli';

	const files: Record<string, string> = {
		'pyproject.toml': pyprojectToml(config, dist, mod),
		[`src/${mod}/__init__.py`]: initPy(config, mod),
		[`src/${mod}/py.typed`]: '',
		[`tests/test_${mod}.py`]: testPy(mod, isCli),
		'README.md': readme(config, dist),
		'.gitignore': gitignore(),
		'.python-version': `${config.pythonVersion}\n`,
	};
	if (isCli) files[`src/${mod}/__main__.py`] = mainPy(config, dist, mod);
	if (config.license !== 'none')
		files['LICENSE'] = licenseText(config.license, authorName(config.author));

	const baseline = buildBaseline(files);
	files['packkit.json'] = provenance(config, {
		preset: options.preset,
		version: options.version,
		baseline,
	});

	return {
		config,
		files,
		diagnostics: [],
		metadata: {
			generatorId: GENERATOR_ID,
			generatorVersion: options.version,
			protocolVersion: PACKKIT_PROTOCOL_VERSION,
			schemaVersion: PROVENANCE_SCHEMA_VERSION,
			preset: options.preset,
		},
		deploymentContract: deriveDeploymentContract(config),
		summary: {
			distributionName: dist,
			moduleName: mod,
			target: config.target,
			fileCount: Object.keys(files).length,
		},
	};
}

// --- author helpers ---------------------------------------------------------

// "DanMat <dan@example.com>" → { name: "DanMat", email: "dan@example.com" }
function authorName(author: string): string {
	return author.replace(/<[^>]*>/, '').trim() || 'The authors';
}
function authorEmail(author: string): string | undefined {
	return author.match(/<([^>]+)>/)?.[1];
}

// --- file templates ---------------------------------------------------------

function pyprojectToml(cfg: PyConfig, dist: string, mod: string): string {
	const tv = `py${cfg.pythonVersion.replace('.', '')}`;
	const email = authorEmail(cfg.author);
	const author = email
		? `{ name = "${authorName(cfg.author)}", email = "${email}" }`
		: `{ name = "${authorName(cfg.author)}" }`;
	const dev = ['"pytest>=9"', '"ruff>=0.6"', ...(cfg.typecheck ? ['"mypy>=2"'] : [])];

	const lines = [
		'[project]',
		`name = "${dist}"`,
		'version = "0.1.0"',
		`description = ${JSON.stringify(cfg.description)}`,
		'readme = "README.md"',
		`requires-python = ">=${cfg.pythonVersion}"`,
		...(cfg.license !== 'none' ? [`license = { text = "${cfg.license}" }`] : []),
		`authors = [${author}]`,
		'dependencies = []',
		'',
		'[project.optional-dependencies]',
		`dev = [${dev.join(', ')}]`,
	];
	if (cfg.target === 'cli') {
		lines.push('', '[project.scripts]', `${dist} = "${mod}.__main__:main"`);
	}
	lines.push(
		'',
		'[build-system]',
		'requires = ["hatchling"]',
		'build-backend = "hatchling.build"',
		'',
		'[tool.hatch.build.targets.wheel]',
		`packages = ["src/${mod}"]`,
		'',
		'[tool.ruff]',
		'line-length = 100',
		`target-version = "${tv}"`,
		'',
		'[tool.ruff.lint]',
		'select = ["E", "F", "I", "UP", "B"]',
		'',
		'[tool.pytest.ini_options]',
		'testpaths = ["tests"]',
		'addopts = "-q"',
	);
	if (cfg.typecheck) {
		lines.push(
			'',
			'[tool.mypy]',
			`python_version = "${cfg.pythonVersion}"`,
			'strict = true',
			'files = ["src", "tests"]',
		);
	}
	return `${lines.join('\n')}\n`;
}

function initPy(cfg: PyConfig, mod: string): string {
	return [
		`"""${cfg.description || dist_title(mod)}"""`,
		'',
		'__version__ = "0.1.0"',
		'',
		'',
		'def greet(name: str) -> str:',
		'    """Return a friendly greeting."""',
		'    return f"Hello, {name}!"',
		'',
	].join('\n');
}

function mainPy(cfg: PyConfig, dist: string, mod: string): string {
	return [
		`"""Command-line entry point for ${dist}."""`,
		'',
		'import argparse',
		'',
		`from ${mod} import greet`,
		'',
		'',
		'def main() -> None:',
		`    parser = argparse.ArgumentParser(prog="${dist}", description=${JSON.stringify(cfg.description || dist)})`,
		'    parser.add_argument("name", nargs="?", default="world", help="who to greet")',
		'    args = parser.parse_args()',
		'    print(greet(args.name))',
		'',
		'',
		'if __name__ == "__main__":',
		'    main()',
		'',
	].join('\n');
}

function testPy(mod: string, isCli: boolean): string {
	if (!isCli) {
		return [
			`from ${mod} import greet`,
			'',
			'',
			'def test_greet() -> None:',
			'    assert greet("world") == "Hello, world!"',
			'',
		].join('\n');
	}
	// CLI test: all imports at the top (ruff E402), typed pytest fixtures (mypy strict).
	return [
		'import sys',
		'',
		'import pytest',
		'',
		`from ${mod} import greet`,
		`from ${mod}.__main__ import main`,
		'',
		'',
		'def test_greet() -> None:',
		'    assert greet("world") == "Hello, world!"',
		'',
		'',
		'def test_main_greets(capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch) -> None:',
		`    monkeypatch.setattr(sys, "argv", ["${mod}", "there"])`,
		'    main()',
		'    assert "Hello, there!" in capsys.readouterr().out',
		'',
	].join('\n');
}

function readme(cfg: PyConfig, dist: string): string {
	const run = cfg.typecheck ? '\nuv run mypy' : '';
	return [
		`# ${dist}`,
		'',
		`> ${cfg.description || 'A modern Python project scaffolded with [create-packkit-py](https://github.com/PackkitJS/create-packkit-py).'}`,
		'',
		'## Develop',
		'',
		'```sh',
		'uv sync --all-extras        # or: pip install -e ".[dev]"',
		'uv run pytest',
		'uv run ruff check .' + run,
		'```',
		'',
		...(cfg.target === 'cli' ? [`## Run`, '', '```sh', `uv run ${dist} world`, '```', ''] : []),
	].join('\n');
}

function gitignore(): string {
	return [
		'__pycache__/',
		'*.py[cod]',
		'.venv/',
		'venv/',
		'dist/',
		'build/',
		'*.egg-info/',
		'.pytest_cache/',
		'.mypy_cache/',
		'.ruff_cache/',
		'.coverage',
		'',
	].join('\n');
}

function dist_title(mod: string): string {
	return mod.replace(/_/g, ' ');
}
