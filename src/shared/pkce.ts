import { deleteData, getData, getKeys, saveData } from './db';
import { encode, getRandom } from './utils';

const PKCE_PARAM_NAME = 'auth-worker/pkce';

interface IPKCE {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256' | 'plain';
}

function arrayBufferToHex(arrayBuffer: ArrayBuffer): string {
	return encode(arrayBuffer).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
}

export async function getPkceVerifier(provider: string) {
	const param = PKCE_PARAM_NAME + '/' + provider;
	let verifier = await getData(param);
	if (!verifier) {
		verifier = getRandom(128);
		await saveData(param, verifier);
	}

	return verifier;
}

export async function generateAsyncPKCE(provider: string): Promise<IPKCE> {
	const plain = await getPkceVerifier(provider);

	if ('crypto' in globalThis) {
		const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
		return {
			codeVerifier: plain,
			codeChallenge: arrayBufferToHex(hash),
			codeChallengeMethod: 'S256',
		};
	}
	throw new Error('Crypto API not supported');
}

export async function deletePkce() {
	const allKeys = await getKeys();
	const keys = allKeys.filter((key) => key.startsWith(PKCE_PARAM_NAME + '/'));
	await deleteData(keys);
}
