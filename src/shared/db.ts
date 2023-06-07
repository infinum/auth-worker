import { get, set, keys, delMany } from '../vendor/idb-keyval';

export const SECURE_KEY = 'auth-worker-state';

// let secret: Promise<CryptoKey> | null = null;

// const iv = crypto.getRandomValues(new Uint8Array(12));

export function setSecret(secretPhrase: string) {
	// const buf = new ArrayBuffer(secretPhrase.length);
	// const bufView = new Uint8Array(buf);
	// for (let i = 0, strLen = secretPhrase.length; i < strLen; i++) {
	// 	bufView[i] = secretPhrase.charCodeAt(i);
	// }
	// secret = crypto.subtle.importKey('raw', buf, { name: 'PBKDF2' }, false, ['deriveKey']).then((importedKey) => {
	// 	return crypto.subtle.deriveKey(
	// 		{
	// 			name: 'PBKDF2',
	// 			salt: new Uint8Array(0),
	// 			iterations: 1,
	// 			hash: 'SHA-256',
	// 		},
	// 		importedKey,
	// 		{ name: 'AES-GCM', length: 256 },
	// 		true,
	// 		['encrypt', 'decrypt']
	// 	);
	// });
}

async function encrypt(data: string) {
	// if (!secret) {
	// 	throw new Error('The secret was not provided');
	// }

	// try {
	// 	const dataBuffer = new TextEncoder().encode(data);

	// 	return crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await secret, dataBuffer).then((encrypted) => {
	// 		return new TextDecoder().decode(encrypted);
	// 	});
	// } catch (e) {
	// 	console.log(e);
	// 	return '';
	// }
	return data;
}

async function decrypt(data: string) {
	// if (!secret) {
	// 	throw new Error('The secret was not provided');
	// }

	// try {
	// 	const decrypted = await crypto.subtle.decrypt(
	// 		{ name: 'AES-GCM', iv },
	// 		await secret,
	// 		new TextEncoder().encode(data)
	// 	);
	// 	const decryptedArray = Array.from(new Uint8Array(decrypted));
	// 	const resultArray = new Uint8Array(decryptedArray.length);
	// 	resultArray.set(decryptedArray);
	// 	// return String.fromCharCode(...resultArray);
	// 	return '';
	// } catch (e) {
	// 	console.log(e);
	// 	return null;
	// }
	return data;
}

export async function getData(key: string): Promise<string | null> {
	try {
		const rawValue = await get(key);
		if (!rawValue) return null;
		const value = key === SECURE_KEY ? await decrypt(rawValue) : rawValue;
		return value;
	} catch (e) {
		console.log(e);
		return null;
	}
}

export async function saveData(key: string, value: string) {
	const valueToSave = key === SECURE_KEY ? await encrypt(value) : value;
	return set(key, valueToSave);
}

export async function deleteData(keys: Array<string>): Promise<void> {
	return delMany(keys);
}

export async function getKeys(): Promise<Array<string>> {
	return keys();
}
