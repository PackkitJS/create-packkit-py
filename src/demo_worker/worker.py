"""A transport-agnostic background worker.

Pull messages from a source, run the handler with bounded retries, and drain
in-flight work on SIGTERM/SIGINT before exiting 0. No queue SDK is baked in — wire
`receive()` to your transport (SQS, Kafka, Redis, ...). Logs are JSON lines on
stdout; liveness is the process itself, so there is no HTTP port or health check.
"""

from __future__ import annotations

import json
import os
import select
import signal
import sys
from collections.abc import Iterator
from dataclasses import dataclass
from types import FrameType

from .handler import handle


@dataclass(frozen=True)
class Config:
    max_attempts: int
    log_level: str

    @classmethod
    def from_env(cls) -> Config:
        return cls(
            max_attempts=int(os.environ.get("WORKER_MAX_ATTEMPTS", "3")),
            log_level=os.environ.get("WORKER_LOG_LEVEL", "info"),
        )


def log(event: str, *, level: str = "info", **fields: object) -> None:
    """Emit one structured JSON line on stdout."""
    print(json.dumps({"level": level, "event": event, **fields}), flush=True)


class Shutdown:
    """Flips on the first SIGTERM/SIGINT so the loop stops taking new work and
    drains what is in flight."""

    def __init__(self) -> None:
        self.requested = False
        signal.signal(signal.SIGTERM, self._request)
        signal.signal(signal.SIGINT, self._request)

    def _request(self, signum: int, _frame: FrameType | None) -> None:
        self.requested = True
        log("shutdown_requested", signal=signal.Signals(signum).name)


def receive(shutdown: Shutdown) -> Iterator[str]:
    """The message-source seam — a demo that reads newline-delimited messages from
    stdin, polling so a drain can interrupt an idle wait. Replace with your
    transport's receive loop; keep it a generator so the worker can stop cleanly
    between messages."""
    while not shutdown.requested:
        ready, _, _ = select.select([sys.stdin], [], [], 0.2)
        if not ready:
            continue
        line = sys.stdin.readline()
        if line == "":  # EOF — the source is exhausted
            return
        yield line.rstrip("\n")


def on_poison(message: str, error: Exception) -> None:
    """A message that failed every attempt. Default: log and drop. Replace with a
    dead-letter queue, a table, an alert — whatever poison means for your system."""
    log("poison_message", level="error", message=message, error=str(error))


def process(message: str, config: Config) -> None:
    for attempt in range(1, config.max_attempts + 1):
        try:
            handle(message)
        except Exception as error:  # a worker must not die on one bad message
            log("handle_failed", level="warning", message=message, attempt=attempt, error=str(error))
            if attempt == config.max_attempts:
                on_poison(message, error)
        else:
            log("handled", message=message, attempt=attempt)
            return


def run() -> int:
    config = Config.from_env()
    shutdown = Shutdown()
    log("worker_started", max_attempts=config.max_attempts)

    processed = 0
    for message in receive(shutdown):
        process(message, config)  # finish this message before re-checking shutdown
        processed += 1

    log("worker_stopped", processed=processed, drained=shutdown.requested)
    return 0
