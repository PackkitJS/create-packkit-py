---
'create-packkit-py': minor
---

Add a **`py-worker`** target/preset — a transport-agnostic background worker (Phase 7, on `@packkit/core`'s `WorkerDeploymentContract`). Emits a unit-testable `handle()` seam, a runner that drains in-flight work on `SIGTERM`/`SIGINT` and exits 0, structured JSON stdout logs, a poison-message seam with bounded retries, env-based config (`WORKER_MAX_ATTEMPTS`/`WORKER_LOG_LEVEL`), a `python -m` entry point, and a Dockerfile with **no** `EXPOSE`/HTTP healthcheck (liveness is the process). No transport SDK is baked in — wire `receive()` to your queue. The generated project's own pytest proves the SIGTERM drain exits 0; `deriveDeploymentContract` returns a `worker` contract. `library`/`cli` unchanged.
