---
'create-packkit-py': patch
---

Consume `@packkit/core@^0.4.0` (which generalizes the `node-service` deployment type to
the language-neutral `service`). No functional change — the Python generator emits only
`library`/`cli`/`worker` contracts — this keeps the whole ecosystem on one core line so a
multi-generator host (packkit-mcp, packkit-web) never resolves a split core.
