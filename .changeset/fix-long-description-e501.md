---
'create-packkit-py': patch
---

Fix #21: a long `--description` no longer makes the generated project fail its own
`ruff check`. The module docstring (`__init__.py`) and the CLI's argparse `description=`
embedded the raw description on one line, so a description over ~100 chars tripped ruff
E501 out of the box. Long descriptions now wrap (multi-line docstring; argparse implicit
string concatenation); short descriptions are unchanged. Verified across all four presets
with real `uv run ruff check`.
