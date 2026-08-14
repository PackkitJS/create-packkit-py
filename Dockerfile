# Container image for the worker. A worker is a long-running process, NOT an HTTP
# server — so there is no EXPOSE and no HTTP HEALTHCHECK; liveness is the process.
FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir .

# Run unprivileged; STOPSIGNAL makes `docker stop` send SIGTERM so the worker drains.
RUN useradd --create-home worker
USER worker
STOPSIGNAL SIGTERM
CMD ["python", "-m", "demo_worker"]
