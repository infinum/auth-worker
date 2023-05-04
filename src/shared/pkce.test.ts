import { LocalStorageMock } from '../../test/mock/localStorage';
import { deletePkce, generatePKCE, getPkceVerifier } from './pkce';

describe('pkce', () => {
	beforeAll(() => {
		global.localStorage = new LocalStorageMock();
	});

	beforeEach(() => {
		localStorage.clear();
	});

	describe('getPkceVerifier', () => {
		it('should work with empty localStorage', () => {
			const data = getPkceVerifier('test');
			const repeat = getPkceVerifier('test');

			expect(data).toEqual(repeat);
			expect(data).toHaveLength(128);
		});

		it('should work with filled localStorage', () => {
			localStorage.setItem('auth-worker/pkce/test', 'test');
			const data = getPkceVerifier('test');

			expect(data).toEqual('test');
		});

		it('should work with multiple providers', () => {
			const dataA = getPkceVerifier('testA');
			const repeatA = getPkceVerifier('testA');
			const dataB = getPkceVerifier('testB');
			const repeatB = getPkceVerifier('testB');

			expect(dataA).toEqual(repeatA);
			expect(dataA).toHaveLength(128);

			expect(dataB).toEqual(repeatB);
			expect(dataB).toHaveLength(128);

			expect(dataA).not.toEqual(dataB);
		});
	});

	describe('generatePKCE', () => {
		it('should generate a valid PKCE', () => {
			const pkce = generatePKCE('test');
			expect(pkce.codeVerifier).toHaveLength(128);
			expect(pkce.codeChallenge).toHaveLength(43);
			expect(pkce.codeChallengeMethod).toEqual('S256');
		});

		it('should return the same keys for the same provider', () => {
			const pkce1 = generatePKCE('test');
			const pkce2 = generatePKCE('test');

			expect(pkce1.codeVerifier).toEqual(pkce2.codeVerifier);
			expect(pkce1.codeChallenge).toEqual(pkce2.codeChallenge);
			expect(pkce1.codeChallengeMethod).toEqual(pkce2.codeChallengeMethod);
		});
	});

	describe('deletePkce', () => {
		it('should regnerate the key after deletion', () => {
			const pkce1 = generatePKCE('test');
			deletePkce();
			const pkce2 = generatePKCE('test');

			expect(pkce1.codeVerifier).not.toEqual(pkce2.codeVerifier);
		});
	});
});
