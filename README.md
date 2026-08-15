# create-packkit-py 🐍📦

> Scaffold a modern **Python** project — `pyproject.toml`/uv, ruff, pytest, `src/` layout — from a CLI (and soon the browser). [Packkit](https://github.com/PackkitLabs/create-packkit)'s Python sibling.

[![npm](https://img.shields.io/npm/v/create-packkit-py.svg)](https://www.npmjs.com/package/create-packkit-py) [![CI](https://github.com/PackkitLabs/create-packkit-py/actions/workflows/ci.yml/badge.svg)](https://github.com/PackkitLabs/create-packkit-py/actions/workflows/ci.yml) [![Configure on the web](https://img.shields.io/badge/⚙_configure-on_the_web-00e5ff)](https://packkit-web.pages.dev/?g=python) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Prefer clicking to typing? **[Configure a Python project in the browser →](https://packkit-web.pages.dev/?g=python)** — pick options, preview the tree, download a zip (or copy the command). No install needed.

Like `create-packkit`, this is a **JavaScript generator** — but its _output_ is an
idiomatic Python project. That means the whole Packkit engine pattern (a
deterministic core, presets, a browser configurator, `--schema`, MCP, and a
`packkit.json` provenance file) carries over, while you get standard Python:
PEP 621 `pyproject.toml`, a `src/` layout, ruff, pytest, mypy, and a hatchling
build. No Python toolchain is needed to _generate_ — only to run what's generated.

## Quick start

```sh
npx create-packkit-py py-lib my-lib
npx create-packkit-py py-cli my-tool
# then:
cd my-lib && uv sync --all-extras && uv run pytest
```

Every generated project **passes `pytest`, `ruff`, and `mypy --strict` out of the
box** — the same guarantee `create-packkit` makes for JS/TS.

## Presets

| Preset   | Alias | What you get                                                                       |
| -------- | ----- | ---------------------------------------------------------------------------------- |
| `py-lib` | `lib` | Library — `src/` layout, ruff, pytest, mypy (strict), hatchling build, `py.typed`. |
| `py-cli` | `cli` | Everything in `py-lib` plus an `argparse` entry point wired as a console script.   |

## Options

```
--name <name>            Distribution name (or a positional, in either slot)
--description <text>
--author "<name> <email>"
--license <MIT|none>     (default: MIT)
--python <3.x>           Minimum Python version (default: 3.11)
--target <library|cli>
--no-typecheck           Skip the mypy config + dev dependency
--here                   Scaffold into the current directory
--force                  Overwrite existing files
```

## Where it fits

`create-packkit-py` is a **separate package**, not a fork of `create-packkit`'s
core — Packkit stays JS/TS-focused, and Python lives in its own sibling. The two
are composed at the edges: the shared `packkit-mcp` server can front both, and
the browser configurator can host both engines.

Roadmap: uv/Poetry/PDM choice · Apache-2.0 · ruff/mypy config knobs · web
configurator + MCP wiring · baseline-aware `upgrade`.

## Requirements

Node.js >= 20 to run the generator.

## License

MIT © DanMat
