import signal
import subprocess
import sys
import time

import pytest

from demo_worker.handler import handle


def test_handle_accepts_a_message() -> None:
    handle("hello")


def test_handle_rejects_an_empty_message() -> None:
    with pytest.raises(ValueError):
        handle("   ")


def test_worker_drains_on_sigterm_and_exits_zero() -> None:
    proc = subprocess.Popen(
        [sys.executable, "-m", "demo_worker"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True,
    )
    assert proc.stdin is not None
    proc.stdin.write("one\n")
    proc.stdin.flush()
    time.sleep(0.5)  # let the in-flight message be handled
    proc.send_signal(signal.SIGTERM)
    out, _ = proc.communicate(timeout=10)

    assert proc.returncode == 0
    assert '"event": "handled"' in out
    assert '"event": "worker_stopped"' in out
