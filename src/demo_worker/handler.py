"""Business logic for one message — the unit-testable seam.

Pure: no queue, no I/O, no logging. Replace the body with your processing; raise
to signal a failure the worker should retry (and, after WORKER_MAX_ATTEMPTS,
route to the poison-message handler).
"""


def handle(message: str) -> None:
    if not message.strip():
        raise ValueError("empty message")
    # TODO: replace with your processing.
