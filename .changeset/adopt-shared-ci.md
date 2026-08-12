---
'create-packkit-py': patch
---

Adopt the shared PackkitJS/packkit-actions CI. Runs `generator-ci@v1` via a standard `check` script; adds end-to-end integration tests through `generator-integration@v1` (scaffold each preset with the real CLI, then `uv sync` + pytest/ruff/mypy, and execute the console script for `py-cli`); adds a `security@v1` npm-audit gate. No runtime changes to the generated output.
