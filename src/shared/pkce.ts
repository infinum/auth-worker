import { getRandom } from './utils';

interface IPKCE {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256' | 'plain';
}

export async function generate(): Promise<IPKCE> {
	const plain = getRandom(128);

	if ('crypto' in globalThis && 'subtle' in globalThis.crypto) {
		const sha256 = globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));

		return {
			codeVerifier: plain,
			codeChallenge: String(sha256),
			codeChallengeMethod: 'S256',
		};
	} else {
		return {
			codeVerifier: plain,
			codeChallenge: plain,
			codeChallengeMethod: 'plain',
		};
	}
}
