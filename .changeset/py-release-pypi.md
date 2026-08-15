---
'create-packkit-py': minor
---

Add a `--release` option (`none` | `pypi`, default `none`). `--release pypi` scaffolds
a `.github/workflows/release.yml` that publishes to PyPI on a version tag using
**Trusted Publishing** (OIDC — no API token in the repo), via the canonical
`setup-python` + `python -m build` + `pypa/gh-action-pypi-publish` flow, plus a README
"Release" section documenting the one-time PyPI Trusted-Publisher setup. This is the
Python-idiomatic equivalent of the JS generator's Changesets release feature (Changesets
is npm-specific, so it isn't forced into Python output). Also surfaced in the generator
schema (so the web/MCP configurators offer it) and fixed the schema's `target` choices to
include `service`.
