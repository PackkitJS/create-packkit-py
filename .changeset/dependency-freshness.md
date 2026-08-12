---
'create-packkit-py': patch
---

Add a template-dependency freshness check (`check:freshness` — compares the PyPI deps the generator emits to the latest published) wired to the shared `dependency-freshness@v1` weekly workflow, and bring the emitted dev-tool floors current: `pytest>=9` and `mypy>=2` (verified by integration on real uv/pytest/mypy).
