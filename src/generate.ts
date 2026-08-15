import { PACKKIT_PROTOCOL_VERSION } from '@packkit/core';
import type { GeneratedPyProject, PyConfig, PyConfigInput } from './types.js';
import { GENERATOR_ID, PROVENANCE_SCHEMA_VERSION } from './constants.js';
import { normalizeConfig } from './options.js';
import { distributionName, moduleName } from './naming.js';
import { provenance } from './provenance.js';
import { buildBaseline } from './baseline.js';
import { deriveDeploymentContract } from './deployment.js';
import { licenseText } from './license.js';

/** Generate a Python project in memory. Deterministic: same config → same bytes. */
export function generate(
	input: PyConfigInput,
	options: { preset?: string; version?: string } = {},
): GeneratedPyProject {
	const config = normalizeConfig(input);
	const dist = distributionName(config.name);
	const mod = moduleName(dist);
	const isCli = config.target === 'cli';
	const isWorker = config.target === 'worker';
	const isService = config.target === 'service';

	const files: Record<string, string> = {
		'pyproject.toml': pyprojectToml(config, dist, mod),
		[`src/${mod}/__init__.py`]: isWorker
			? workerInitPy(config, dist)
			: isService
				? serviceInitPy(config, dist)
				: initPy(config, mod),
		[`src/${mod}/py.typed`]: '',
		[`tests/test_${mod}.py`]: isWorker
			? workerTestPy(mod)
			: isService
				? serviceTestPy(mod)
				: testPy(mod, isCli),
		'README.md': readme(config, dist),
		'.gitignore': gitignore(),
		'.python-version': `${config.pythonVersion}\n`,
	};
	if (isCli) files[`src/${mod}/__main__.py`] = mainPy(config, dist, mod);
	if (isWorker) {
		files[`src/${mod}/handler.py`] = workerHandlerPy();
		files[`src/${mod}/worker.py`] = workerRunnerPy();
		files[`src/${mod}/__main__.py`] = workerMainPy(mod);
		files['Dockerfile'] = workerDockerfile(config, mod);
		files['.dockerignore'] = workerDockerignore();
	}
	if (isService) {
		files[`src/${mod}/app.py`] = serviceAppPy(dist);
		files[`src/${mod}/__main__.py`] = serviceMainPy(mod);
		files['Dockerfile'] = serviceDockerfile(config, mod);
		files['.dockerignore'] = workerDockerignore();
	}
	if (config.license !== 'none')
		files['LICENSE'] = licenseText(config.license, authorName(config.author));

	const baseline = buildBaseline(files);
	files['packkit.json'] = provenance(config, {
		preset: options.preset,
		version: options.version,
		baseline,
	});

	return {
		config,
		files,
		diagnostics: [],
		metadata: {
			generatorId: GENERATOR_ID,
			generatorVersion: options.version,
			protocolVersion: PACKKIT_PROTOCOL_VERSION,
			schemaVersion: PROVENANCE_SCHEMA_VERSION,
			preset: options.preset,
		},
		deploymentContract: deriveDeploymentContract(config),
		summary: {
			distributionName: dist,
			moduleName: mod,
			target: config.target,
			fileCount: Object.keys(files).length,
		},
	};
}

// --- author helpers ---------------------------------------------------------

// "DanMat <dan@example.com>" → { name: "DanMat", email: "dan@example.com" }
function authorName(author: string): string {
	return author.replace(/<[^>]*>/, '').trim() || 'The authors';
}
function authorEmail(author: string): string | undefined {
	return author.match(/<([^>]+)>/)?.[1];
}

// --- file templates ---------------------------------------------------------

function pyprojectToml(cfg: PyConfig, dist: string, mod: string): string {
	const tv = `py${cfg.pythonVersion.replace('.', '')}`;
	const email = authorEmail(cfg.author);
	const author = email
		? `{ name = "${authorName(cfg.author)}", email = "${email}" }`
		: `{ name = "${authorName(cfg.author)}" }`;
	const isService = cfg.target === 'service';
	const runtimeDeps = isService ? ['"fastapi>=0.115"', '"uvicorn[standard]>=0.30"'] : [];
	// FastAPI's TestClient needs httpx; keep it a dev dependency.
	const dev = [
		'"pytest>=9"',
		'"ruff>=0.6"',
		...(isService ? ['"httpx>=0.27"'] : []),
		...(cfg.typecheck ? ['"mypy>=2"'] : []),
	];

	const lines = [
		'[project]',
		`name = "${dist}"`,
		'version = "0.1.0"',
		`description = ${JSON.stringify(cfg.description)}`,
		'readme = "README.md"',
		`requires-python = ">=${cfg.pythonVersion}"`,
		...(cfg.license !== 'none' ? [`license = { text = "${cfg.license}" }`] : []),
		`authors = [${author}]`,
		`dependencies = [${runtimeDeps.join(', ')}]`,
		'',
		'[project.optional-dependencies]',
		`dev = [${dev.join(', ')}]`,
	];
	if (cfg.target === 'cli') {
		lines.push('', '[project.scripts]', `${dist} = "${mod}.__main__:main"`);
	}
	lines.push(
		'',
		'[build-system]',
		'requires = ["hatchling"]',
		'build-backend = "hatchling.build"',
		'',
		'[tool.hatch.build.targets.wheel]',
		`packages = ["src/${mod}"]`,
		'',
		'[tool.ruff]',
		'line-length = 100',
		`target-version = "${tv}"`,
		'',
		'[tool.ruff.lint]',
		'select = ["E", "F", "I", "UP", "B"]',
		'',
		'[tool.pytest.ini_options]',
		'testpaths = ["tests"]',
		'addopts = "-q"',
	);
	if (cfg.typecheck) {
		lines.push(
			'',
			'[tool.mypy]',
			`python_version = "${cfg.pythonVersion}"`,
			'strict = true',
			'files = ["src", "tests"]',
		);
	}
	return `${lines.join('\n')}\n`;
}

function initPy(cfg: PyConfig, mod: string): string {
	return [
		`"""${cfg.description || dist_title(mod)}"""`,
		'',
		'__version__ = "0.1.0"',
		'',
		'',
		'def greet(name: str) -> str:',
		'    """Return a friendly greeting."""',
		'    return f"Hello, {name}!"',
		'',
	].join('\n');
}

function mainPy(cfg: PyConfig, dist: string, mod: string): string {
	return [
		`"""Command-line entry point for ${dist}."""`,
		'',
		'import argparse',
		'',
		`from ${mod} import greet`,
		'',
		'',
		'def main() -> None:',
		`    parser = argparse.ArgumentParser(prog="${dist}", description=${JSON.stringify(cfg.description || dist)})`,
		'    parser.add_argument("name", nargs="?", default="world", help="who to greet")',
		'    args = parser.parse_args()',
		'    print(greet(args.name))',
		'',
		'',
		'if __name__ == "__main__":',
		'    main()',
		'',
	].join('\n');
}

function testPy(mod: string, isCli: boolean): string {
	if (!isCli) {
		return [
			`from ${mod} import greet`,
			'',
			'',
			'def test_greet() -> None:',
			'    assert greet("world") == "Hello, world!"',
			'',
		].join('\n');
	}
	// CLI test: all imports at the top (ruff E402), typed pytest fixtures (mypy strict).
	return [
		'import sys',
		'',
		'import pytest',
		'',
		`from ${mod} import greet`,
		`from ${mod}.__main__ import main`,
		'',
		'',
		'def test_greet() -> None:',
		'    assert greet("world") == "Hello, world!"',
		'',
		'',
		'def test_main_greets(capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch) -> None:',
		`    monkeypatch.setattr(sys, "argv", ["${mod}", "there"])`,
		'    main()',
		'    assert "Hello, there!" in capsys.readouterr().out',
		'',
	].join('\n');
}

function readme(cfg: PyConfig, dist: string): string {
	const run = cfg.typecheck ? '\nuv run mypy' : '';
	return [
		`# ${dist}`,
		'',
		`> ${cfg.description || 'A modern Python project scaffolded with [create-packkit-py](https://github.com/PackkitLabs/create-packkit-py).'}`,
		'',
		'## Develop',
		'',
		'```sh',
		'uv sync --all-extras        # or: pip install -e ".[dev]"',
		'uv run pytest',
		'uv run ruff check .' + run,
		'```',
		'',
		...(cfg.target === 'cli' ? [`## Run`, '', '```sh', `uv run ${dist} world`, '```', ''] : []),
		...(cfg.target === 'worker'
			? [
					'## Run',
					'',
					'A transport-agnostic background worker: it reads newline-delimited messages from',
					'stdin (the demo source), runs `handle()` on each, and drains in-flight work on',
					'`SIGTERM`/`SIGINT` before exiting 0. Wire `receive()` in `worker.py` to your queue.',
					'',
					'```sh',
					`printf 'one\\ntwo\\n' | uv run python -m ${moduleName(dist)}`,
					'',
					'# container (no HTTP port — liveness is the process)',
					`docker build -t ${dist} . && docker run --rm -i ${dist}`,
					'```',
					'',
					'Config via env: `WORKER_MAX_ATTEMPTS` (retries before a message is routed to the',
					'poison-message seam), `WORKER_LOG_LEVEL`.',
					'',
				]
			: []),
		...(cfg.target === 'service'
			? [
					'## Run',
					'',
					'A FastAPI HTTP service on uvicorn. It serves `/` and a `/healthz` liveness probe,',
					'and binds `$PORT` (default 8000).',
					'',
					'```sh',
					`uv run python -m ${moduleName(dist)}   # then: curl localhost:8000/healthz`,
					'',
					'# container',
					`docker build -t ${dist} . && docker run --rm -p 8000:8000 ${dist}`,
					'```',
					'',
					'Set `PORT` to change the listen port.',
					'',
				]
			: []),
	].join('\n');
}

// --- worker templates -------------------------------------------------------

function workerInitPy(cfg: PyConfig, dist: string): string {
	return [
		`"""${cfg.description || `${dist} — a background worker.`}"""`,
		'',
		'__version__ = "0.1.0"',
		'',
	].join('\n');
}

function workerHandlerPy(): string {
	return [
		'"""Business logic for one message — the unit-testable seam.',
		'',
		'Pure: no queue, no I/O, no logging. Replace the body with your processing; raise',
		'to signal a failure the worker should retry (and, after WORKER_MAX_ATTEMPTS,',
		'route to the poison-message handler).',
		'"""',
		'',
		'',
		'def handle(message: str) -> None:',
		'    if not message.strip():',
		'        raise ValueError("empty message")',
		'    # TODO: replace with your processing.',
		'',
	].join('\n');
}

function workerRunnerPy(): string {
	return [
		'"""A transport-agnostic background worker.',
		'',
		'Pull messages from a source, run the handler with bounded retries, and drain',
		'in-flight work on SIGTERM/SIGINT before exiting 0. No queue SDK is baked in — wire',
		'`receive()` to your transport (SQS, Kafka, Redis, ...). Logs are JSON lines on',
		'stdout; liveness is the process itself, so there is no HTTP port or health check.',
		'"""',
		'',
		'from __future__ import annotations',
		'',
		'import json',
		'import os',
		'import select',
		'import signal',
		'import sys',
		'from collections.abc import Iterator',
		'from dataclasses import dataclass',
		'from types import FrameType',
		'',
		`from .handler import handle`,
		'',
		'',
		'@dataclass(frozen=True)',
		'class Config:',
		'    max_attempts: int',
		'    log_level: str',
		'',
		'    @classmethod',
		'    def from_env(cls) -> Config:',
		'        return cls(',
		'            max_attempts=int(os.environ.get("WORKER_MAX_ATTEMPTS", "3")),',
		'            log_level=os.environ.get("WORKER_LOG_LEVEL", "info"),',
		'        )',
		'',
		'',
		'def log(event: str, *, level: str = "info", **fields: object) -> None:',
		'    """Emit one structured JSON line on stdout."""',
		'    print(json.dumps({"level": level, "event": event, **fields}), flush=True)',
		'',
		'',
		'class Shutdown:',
		'    """Flips on the first SIGTERM/SIGINT so the loop stops taking new work and',
		'    drains what is in flight."""',
		'',
		'    def __init__(self) -> None:',
		'        self.requested = False',
		'        signal.signal(signal.SIGTERM, self._request)',
		'        signal.signal(signal.SIGINT, self._request)',
		'',
		'    def _request(self, signum: int, _frame: FrameType | None) -> None:',
		'        self.requested = True',
		'        log("shutdown_requested", signal=signal.Signals(signum).name)',
		'',
		'',
		'def receive(shutdown: Shutdown) -> Iterator[str]:',
		'    """The message-source seam — a demo that reads newline-delimited messages from',
		'    stdin, polling so a drain can interrupt an idle wait. Replace with your',
		"    transport's receive loop; keep it a generator so the worker can stop cleanly",
		'    between messages."""',
		'    while not shutdown.requested:',
		'        ready, _, _ = select.select([sys.stdin], [], [], 0.2)',
		'        if not ready:',
		'            continue',
		'        line = sys.stdin.readline()',
		'        if line == "":  # EOF — the source is exhausted',
		'            return',
		'        yield line.rstrip("\\n")',
		'',
		'',
		'def on_poison(message: str, error: Exception) -> None:',
		'    """A message that failed every attempt. Default: log and drop. Replace with a',
		'    dead-letter queue, a table, an alert — whatever poison means for your system."""',
		'    log("poison_message", level="error", message=message, error=str(error))',
		'',
		'',
		'def process(message: str, config: Config) -> None:',
		'    for attempt in range(1, config.max_attempts + 1):',
		'        try:',
		'            handle(message)',
		'        except Exception as error:  # a worker must not die on one bad message',
		'            log(',
		'                "handle_failed",',
		'                level="warning",',
		'                message=message,',
		'                attempt=attempt,',
		'                error=str(error),',
		'            )',
		'            if attempt == config.max_attempts:',
		'                on_poison(message, error)',
		'        else:',
		'            log("handled", message=message, attempt=attempt)',
		'            return',
		'',
		'',
		'def run() -> int:',
		'    config = Config.from_env()',
		'    shutdown = Shutdown()',
		'    log("worker_started", max_attempts=config.max_attempts)',
		'',
		'    processed = 0',
		'    for message in receive(shutdown):',
		'        process(message, config)  # finish this message before re-checking shutdown',
		'        processed += 1',
		'',
		'    log("worker_stopped", processed=processed, drained=shutdown.requested)',
		'    return 0',
		'',
	].join('\n');
}

function workerMainPy(mod: string): string {
	return [
		`"""Entry point: run the worker with \`python -m ${mod}\`."""`,
		'',
		'import sys',
		'',
		'from .worker import run',
		'',
		'if __name__ == "__main__":',
		'    sys.exit(run())',
		'',
	].join('\n');
}

function workerTestPy(mod: string): string {
	return [
		'import signal',
		'import subprocess',
		'import sys',
		'import time',
		'',
		'import pytest',
		'',
		`from ${mod}.handler import handle`,
		'',
		'',
		'def test_handle_accepts_a_message() -> None:',
		'    handle("hello")',
		'',
		'',
		'def test_handle_rejects_an_empty_message() -> None:',
		'    with pytest.raises(ValueError):',
		'        handle("   ")',
		'',
		'',
		'def test_worker_drains_on_sigterm_and_exits_zero() -> None:',
		'    proc = subprocess.Popen(',
		`        [sys.executable, "-m", "${mod}"],`,
		'        stdin=subprocess.PIPE,',
		'        stdout=subprocess.PIPE,',
		'        text=True,',
		'    )',
		'    assert proc.stdin is not None',
		'    proc.stdin.write("one\\n")',
		'    proc.stdin.flush()',
		'    time.sleep(0.5)  # let the in-flight message be handled',
		'    proc.send_signal(signal.SIGTERM)',
		'    out, _ = proc.communicate(timeout=10)',
		'',
		'    assert proc.returncode == 0',
		'    assert \'"event": "handled"\' in out',
		'    assert \'"event": "worker_stopped"\' in out',
		'',
	].join('\n');
}

function workerDockerfile(cfg: PyConfig, mod: string): string {
	return [
		'# Container image for the worker. A worker is a long-running process, NOT an HTTP',
		'# server — so there is no EXPOSE and no HTTP HEALTHCHECK; liveness is the process.',
		`FROM python:${cfg.pythonVersion}-slim`,
		'',
		'WORKDIR /app',
		'',
		'COPY pyproject.toml README.md ./',
		'COPY src ./src',
		'RUN pip install --no-cache-dir .',
		'',
		'# Run unprivileged; STOPSIGNAL makes `docker stop` send SIGTERM so the worker drains.',
		'RUN useradd --create-home worker',
		'USER worker',
		'STOPSIGNAL SIGTERM',
		`CMD ["python", "-m", "${mod}"]`,
		'',
	].join('\n');
}

function workerDockerignore(): string {
	return [
		'__pycache__/',
		'*.py[cod]',
		'.venv/',
		'dist/',
		'build/',
		'*.egg-info/',
		'.pytest_cache/',
		'.mypy_cache/',
		'.ruff_cache/',
		'.git/',
		'',
	].join('\n');
}

function serviceInitPy(cfg: PyConfig, dist: string): string {
	return [
		`"""${cfg.description || `${dist} — an HTTP service.`}"""`,
		'',
		'__version__ = "0.1.0"',
		'',
	].join('\n');
}

// The FastAPI app object is the testable seam — exercised in-process with Starlette's
// TestClient (no port, no running server). Add your routes here.
function serviceAppPy(dist: string): string {
	return [
		'"""The FastAPI application — the testable seam. Add your routes here."""',
		'',
		'from fastapi import FastAPI',
		'',
		`app = FastAPI(title="${dist}")`,
		'',
		'',
		'@app.get("/healthz")',
		'def healthz() -> dict[str, str]:',
		'    """Liveness probe — the deployment contract points its health check here."""',
		'    return {"status": "ok"}',
		'',
		'',
		'@app.get("/")',
		'def root() -> dict[str, str]:',
		'    return {"message": "Hello, world!"}',
		'',
	].join('\n');
}

// Entry point: `python -m <mod>` runs uvicorn on $PORT (default 8000). The deployment
// contract's startCommand mirrors this; the Dockerfile CMD is the same.
function serviceMainPy(mod: string): string {
	return [
		`"""Run the HTTP service: \`python -m ${mod}\` (uvicorn on $PORT)."""`,
		'',
		'import os',
		'',
		'import uvicorn',
		'',
		'',
		'def main() -> None:',
		`    uvicorn.run(`,
		`        "${mod}.app:app",`,
		'        host="0.0.0.0",',
		'        port=int(os.environ.get("PORT", "8000")),',
		'    )',
		'',
		'',
		'if __name__ == "__main__":',
		'    main()',
		'',
	].join('\n');
}

function serviceTestPy(mod: string): string {
	return [
		'from fastapi.testclient import TestClient',
		'',
		`from ${mod}.app import app`,
		'',
		'client = TestClient(app)',
		'',
		'',
		'def test_healthz() -> None:',
		'    resp = client.get("/healthz")',
		'    assert resp.status_code == 200',
		'    assert resp.json() == {"status": "ok"}',
		'',
		'',
		'def test_root() -> None:',
		'    resp = client.get("/")',
		'    assert resp.status_code == 200',
		'    assert "message" in resp.json()',
		'',
	].join('\n');
}

function serviceDockerfile(cfg: PyConfig, mod: string): string {
	return [
		'# Container image for the HTTP service. Listens on 8000 (override with PORT).',
		`FROM python:${cfg.pythonVersion}-slim`,
		'',
		'WORKDIR /app',
		'',
		'COPY pyproject.toml README.md ./',
		'COPY src ./src',
		'RUN pip install --no-cache-dir .',
		'',
		'RUN useradd --create-home appuser',
		'USER appuser',
		'EXPOSE 8000',
		`CMD ["python", "-m", "${mod}"]`,
		'',
	].join('\n');
}

function gitignore(): string {
	return [
		'__pycache__/',
		'*.py[cod]',
		'.venv/',
		'venv/',
		'dist/',
		'build/',
		'*.egg-info/',
		'.pytest_cache/',
		'.mypy_cache/',
		'.ruff_cache/',
		'.coverage',
		'',
	].join('\n');
}

function dist_title(mod: string): string {
	return mod.replace(/_/g, ' ');
}
