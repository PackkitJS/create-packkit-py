---
'create-packkit-py': minor
---

Add the `py-service` preset — a Python HTTP service on **FastAPI + uvicorn**. It ships a
testable `app` seam (serving `/` and a `/healthz` liveness probe), a `python -m <pkg>`
entry that runs uvicorn on `$PORT` (default 8000), `TestClient` tests, and a `Dockerfile`.
It emits the language-neutral **`service`** deployment contract (`runtime: "python-3.x"`,
`healthCheckPath: "/healthz"`) — the same contract a Node or Go service emits, so any
provider deploys it identically. Fills Python's missing service target (it previously had
only library/CLI/worker). CI boots the real server and checks `/healthz`.
