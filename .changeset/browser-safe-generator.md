---
'create-packkit-py': patch
---

Make the package browser-safe: the generator no longer reads `package.json` via `node:fs` at runtime (its version is injected at build time), so `create-packkit-py` can be bundled for the browser — e.g. by `packkit-web`. The CLI entry is unchanged.
