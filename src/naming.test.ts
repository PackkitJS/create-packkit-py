import { describe, it, expect } from 'vitest';
import { distributionName, moduleName } from './naming.js';
import { PackkitPyError } from './errors.js';

describe('naming', () => {
	it('lower-cases and validates distribution names', () => {
		expect(distributionName('My-Lib')).toBe('my-lib');
		expect(distributionName('pkg_2')).toBe('pkg_2');
	});

	it('derives the import module name from the distribution name', () => {
		expect(moduleName('my-lib')).toBe('my_lib');
		expect(moduleName('my.cool.lib')).toBe('my_cool_lib');
		expect(moduleName('already_ok')).toBe('already_ok');
	});

	it('rejects invalid distribution names', () => {
		expect(() => distributionName('bad name')).toThrow(PackkitPyError);
		expect(() => distributionName('_leading')).toThrow(PackkitPyError);
		expect(() => distributionName('Bad!')).toThrow(PackkitPyError);
	});
});
