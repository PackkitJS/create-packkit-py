import type { DeploymentContract } from '@packkit/core';
import type { PyConfig } from './types.js';
import { distributionName, moduleName } from './naming.js';

// A provider decides support from the contract, never from the language. library /
// CLI are non-deployable; a worker emits the provider-neutral WorkerDeploymentContract
// (a long-running non-HTTP process — liveness is the process, not a port). The build
// is a wheel via hatchling (`uv build`).
export function deriveDeploymentContract(config: PyConfig): DeploymentContract {
	if (config.target === 'cli') return { type: 'cli', buildCommand: 'uv build' };
	if (config.target === 'worker') {
		const mod = moduleName(distributionName(config.name));
		return {
			type: 'worker',
			runtime: `python-${config.pythonVersion}`,
			buildCommand: 'uv build',
			startCommand: `python -m ${mod}`,
			shutdown: { signals: ['SIGTERM', 'SIGINT'], drainsInflight: true },
			health: { type: 'process' },
			requiredEnvironmentVariables: [],
			optionalEnvironmentVariables: ['WORKER_MAX_ATTEMPTS', 'WORKER_LOG_LEVEL'],
		};
	}
	return { type: 'library', buildCommand: 'uv build' };
}
