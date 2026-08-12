import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{ ignores: ['dist', 'coverage'] },
	// Plain-JS Node scripts (build/integration tooling) run under Node, not the
	// browser — give them Node globals so `process`/`console` aren't no-undef.
	{ files: ['**/*.mjs', 'scripts/**/*.js'], languageOptions: { globals: globals.node } },
);
