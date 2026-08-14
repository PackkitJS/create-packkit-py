// create-packkit-py dogfoods @packkit/core's conformance suites: proof it's a valid
// platform generator (generation) AND that a host can drive its full lifecycle
// (digest, definition replay, host extension, baseline upgrade) identically to any
// other generator. Same suites create-packkit passes.
import { describe, it } from 'vitest';
import {
	runGeneratorConformanceSuite,
	runEmbeddedLifecycleConformance,
} from '@packkit/core/testing';
import { pythonGenerator } from './generator.js';

describe('create-packkit-py conforms to the @packkit/core generator contract', () => {
	runGeneratorConformanceSuite(pythonGenerator, (name, fn) => it(name, fn));
});

describe('create-packkit-py passes the embedded lifecycle conformance suite', () => {
	runEmbeddedLifecycleConformance(pythonGenerator, (name, fn) => it(name, fn));
});
