export function getRandom() {
	if ('crypto' in globalThis && 'randomUUID' in globalThis.crypto) {
		return globalThis.crypto.randomUUID();
	}
	return Math.random().toString(36).slice(2);
}
