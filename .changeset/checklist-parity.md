---
'create-packkit-py': minor
---

Bring Python to full generator-checklist parity with JavaScript, realized the Python way
(@packkit/core `GENERATOR_CHECKLIST`). Every scaffold now also gets: a CI workflow
(`ci.yml`: uv → ruff → ruff format → mypy → pytest), Dependabot (pip + github-actions),
community health files (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue + PR templates),
an agent guide (AGENTS.md + CLAUDE.md with uv commands), and a `.editorconfig`. Adds
**Apache-2.0** and **ISC** to the license choices (matching JS), and the CLI now **git
inits** the project with an initial commit (`--no-git` to skip). Verified across all four
presets with real `uv run ruff/mypy/pytest`. Python is no longer an afterthought.
