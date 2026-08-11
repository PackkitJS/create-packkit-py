/** Typed error for all generator failures, so callers can branch on `code`. */
export class PackkitPyError extends Error {
	code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = 'PackkitPyError';
		this.code = code;
	}
}
