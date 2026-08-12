import type { DeploymentContract } from '@packkit/core';
import type { PyConfig } from './types.js';

// Python's 0.1/1.0 targets are non-deployable (library / CLI): a provider decides
// support from the contract, never from the language. The build is a wheel via
// hatchling (`uv build`). Deployable Python shapes (a FastAPI service, a worker)
// will emit service/worker contracts in later versions.
export function deriveDeploymentContract(config: PyConfig): DeploymentContract {
	if (config.target === 'cli') return { type: 'cli', buildCommand: 'uv build' };
	return { type: 'library', buildCommand: 'uv build' };
}
