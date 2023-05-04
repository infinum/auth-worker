export function getRandom(length = 32) {
	let str = '';

	if ('crypto' in globalThis && 'randomUUID' in globalThis.crypto) {
		while (str.length < length) {
			str += globalThis.crypto.randomUUID().replace(/-/g, '');
		}
	} else {
		while (str.length < length) {
			str += Math.random().toString(36).slice(2);
		}
	}

	return str.slice(0, length);
}
