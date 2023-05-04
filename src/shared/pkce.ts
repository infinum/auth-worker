import { sha256 } from './sha256';
import { getRandom } from './utils';

const PKCE_PARAM_NAME = 'auth-worker/pkce';

interface IPKCE {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256' | 'plain';
}

function arrayBufferToHex(arrayBuffer: ArrayBuffer): string {
	return btoa(
		Array.from(arrayBuffer as Uint8Array)
			.map((x: number) => String.fromCharCode(x))
			.join('')
	)
		.replace(/\//g, '_')
		.replace(/\+/g, '-')
		.replace(/=/g, '');
}

export function getPkceVerifier(provider: string): string {
	const param = PKCE_PARAM_NAME + '/' + provider;
	if (!localStorage.getItem(param)) {
		localStorage.setItem(param, getRandom(128));
	}

	return localStorage.getItem(param) as string;
}

export function generatePKCE(provider: string): IPKCE {
	const plain = getPkceVerifier(provider);
	const hash = sha256(plain);

	return {
		codeVerifier: plain,
		codeChallenge: arrayBufferToHex(hash),
		codeChallengeMethod: 'S256',
	};
}

export function deletePkce(): void {
	const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) as string);
	keys.forEach((key) => {
		if (key.startsWith(PKCE_PARAM_NAME + '/')) {
			localStorage.removeItem(key);
		}
	});
}
