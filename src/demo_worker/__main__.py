"""Entry point: run the worker with `python -m demo_worker`."""

import sys

from .worker import run

if __name__ == "__main__":
    sys.exit(run())
