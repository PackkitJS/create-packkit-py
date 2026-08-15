import type { PyConfig } from './types.js';

// The language-neutral checklist capabilities (@packkit/core GENERATOR_CHECKLIST),
// realized the Python way: editor config, CI (uv → ruff/mypy/pytest), Dependabot (pip),
// community health files, and an agent guide. Emitted for every project so Python is a
// first-class Packkit citizen, never an afterthought.
export function scaffoldFiles(cfg: PyConfig): Record<string, string> {
	return {
		'.editorconfig': editorConfig(),
		'.github/workflows/ci.yml': ciWorkflow(cfg),
		'.github/dependabot.yml': dependabot(),
		'AGENTS.md': agents(cfg),
		'CLAUDE.md': 'See [AGENTS.md](./AGENTS.md) for build/test commands and conventions.\n',
		'CONTRIBUTING.md': contributing(),
		'CODE_OF_CONDUCT.md': codeOfConduct(),
		'SECURITY.md': security(),
		'.github/ISSUE_TEMPLATE/bug_report.md': bugReport(),
		'.github/ISSUE_TEMPLATE/feature_request.md': featureRequest(),
		'.github/PULL_REQUEST_TEMPLATE.md': prTemplate(),
	};
}

function editorConfig(): string {
	return [
		'root = true',
		'',
		'[*]',
		'charset = utf-8',
		'end_of_line = lf',
		'insert_final_newline = true',
		'trim_trailing_whitespace = true',
		'indent_style = space',
		'indent_size = 4',
		'',
		'[*.{json,yml,yaml,toml,md}]',
		'indent_size = 2',
		'',
	].join('\n');
}

// CI runs the project's own quality gate. setup-python + `pip install uv` avoids
// depending on a setup-uv tag resolving, so the emitted workflow just works.
function ciWorkflow(cfg: PyConfig): string {
	const steps = [
		'      - uses: actions/checkout@v4',
		'      - uses: actions/setup-python@v5',
		'        with:',
		`          python-version: '${cfg.pythonVersion}'`,
		'      - name: Install uv',
		'        run: pip install uv',
		'      - run: uv sync --all-extras',
		'      - run: uv run ruff check .',
		'      - run: uv run ruff format --check .',
		...(cfg.typecheck ? ['      - run: uv run mypy'] : []),
		'      - run: uv run pytest',
	];
	return [
		'name: CI',
		'on:',
		'  push:',
		'    branches: [main]',
		'  pull_request:',
		'jobs:',
		'  ci:',
		'    runs-on: ubuntu-latest',
		'    steps:',
		...steps,
		'',
	].join('\n');
}

function dependabot(): string {
	return [
		'version: 2',
		'updates:',
		'  - package-ecosystem: pip',
		'    directory: /',
		'    schedule:',
		'      interval: weekly',
		'  - package-ecosystem: github-actions',
		'    directory: /',
		'    schedule:',
		'      interval: weekly',
		'',
	].join('\n');
}

function agents(cfg: PyConfig): string {
	return [
		'# Agent guide',
		'',
		'Commands for working in this project (managed with [uv](https://docs.astral.sh/uv/)):',
		'',
		'```sh',
		'uv sync --all-extras   # install',
		'uv run pytest          # test',
		'uv run ruff check .    # lint',
		'uv run ruff format .   # format',
		...(cfg.typecheck ? ['uv run mypy            # typecheck'] : []),
		'```',
		'',
		'Keep changes minimal and idiomatic; make sure lint, types, and tests pass before',
		'opening a PR.',
		'',
	].join('\n');
}

function contributing(): string {
	return [
		'# Contributing',
		'',
		'Thanks for your interest in contributing!',
		'',
		'## Development',
		'',
		'```sh',
		'uv sync --all-extras',
		'uv run pytest',
		'uv run ruff check .',
		'```',
		'',
		'## Pull requests',
		'',
		'- Create a branch, make your change, and open a PR against `main`.',
		'- Make sure lint, types, and tests pass.',
		'',
	].join('\n');
}

function codeOfConduct(): string {
	return [
		'# Code of Conduct',
		'',
		'This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).',
		'By participating, you are expected to uphold this code. Report unacceptable',
		'behavior to the maintainers.',
		'',
	].join('\n');
}

function security(): string {
	return [
		'# Security Policy',
		'',
		'If you discover a security vulnerability, please **do not** open a public issue.',
		'Instead, report it privately to the maintainers (e.g. via GitHub Security',
		'Advisories). We will respond as quickly as possible.',
		'',
	].join('\n');
}

function bugReport(): string {
	return [
		'---',
		'name: Bug report',
		'about: Report a problem',
		'labels: bug',
		'---',
		'',
		'**Describe the bug**',
		'',
		'**To reproduce**',
		'',
		'**Expected behavior**',
		'',
		'**Environment**',
		'- Version:',
		'- Python:',
		'- OS:',
		'',
	].join('\n');
}

function featureRequest(): string {
	return [
		'---',
		'name: Feature request',
		'about: Suggest an idea',
		'labels: enhancement',
		'---',
		'',
		'**Problem**',
		'',
		'**Proposed solution**',
		'',
		'**Alternatives considered**',
		'',
	].join('\n');
}

function prTemplate(): string {
	return [
		'## Summary',
		'',
		'<!-- What does this change and why? -->',
		'',
		'## Checklist',
		'',
		'- [ ] Tests pass',
		'- [ ] Lint & types pass',
		'- [ ] Docs updated if needed',
		'',
	].join('\n');
}
