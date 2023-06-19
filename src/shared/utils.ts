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

export function encode(data: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(data)));
}

export function decode(data: string): ArrayBuffer {
	return Uint8Array.from(atob(data), (c) => c.charCodeAt(0)).buffer;
}
