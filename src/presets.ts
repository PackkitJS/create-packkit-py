import type { PyConfigInput } from './types.js';

// Presets are partial configs applied over the defaults, so users can skip the
// wizard: `npx create-packkit-py py-lib my-lib`.
export const PRESETS: Record<string, PyConfigInput> = {
	'py-lib': { target: 'library' },
	'py-cli': { target: 'cli' },
	'py-worker': { target: 'worker' },
	'py-service': { target: 'service' },
};

export const PRESET_NAMES = Object.keys(PRESETS);

export const PRESET_ALIASES: Record<string, string> = {
	lib: 'py-lib',
	cli: 'py-cli',
	worker: 'py-worker',
	service: 'py-service',
	svc: 'py-service',
};

export const PRESET_INFO: Record<string, string> = {
	'py-lib': 'Python library — src/ layout, ruff, pytest, hatchling build, py.typed.',
	'py-cli': 'Python CLI — everything in py-lib plus an argparse entry point (console script).',
	'py-worker':
		'Python background worker — a transport-agnostic queue/event consumer: handler seam, graceful SIGTERM/SIGINT drain, structured stdout logs, poison-message seam, Dockerfile (no HTTP port). No transport SDK baked in.',
	'py-service':
		'Python HTTP service — FastAPI app (/, /healthz) on uvicorn, TestClient tests, Dockerfile; emits the language-neutral service deployment contract.',
};

/** Resolve a preset name or alias to its canonical id (or undefined). */
export function resolvePreset(name: string | undefined): string | undefined {
	if (!name) return undefined;
	if (PRESETS[name]) return name;
	if (PRESET_ALIASES[name]) return PRESET_ALIASES[name];
	return undefined;
}
