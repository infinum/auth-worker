export function getRandom(length = 32) {
	let str = '';

	while (str.length < length) {
		str += globalThis.crypto.randomUUID().replace(/-/g, '');
	}

	return str.slice(0, length);
}

export function encode(data: ArrayBuffer): string {
	return globalThis.btoa(String.fromCharCode(...new Uint8Array(data)));
}

export function decode(data: string): ArrayBuffer {
	return Uint8Array.from(globalThis.atob(data), (c) => c.charCodeAt(0)).buffer;
}
