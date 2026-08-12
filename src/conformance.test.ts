// create-packkit-py dogfoods @packkit/core's generator conformance suite: proof
// it's a valid platform generator, the same suite create-packkit passes.
import { describe, it } from 'vitest';
import { runGeneratorConformanceSuite } from '@packkit/core/testing';
import { pythonGenerator } from './generator.js';

describe('create-packkit-py conforms to the @packkit/core generator contract', () => {
	runGeneratorConformanceSuite(pythonGenerator, (name, fn) => it(name, fn));
});
