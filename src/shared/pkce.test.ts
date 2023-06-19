import { deletePkce, generateAsyncPKCE, getPkceVerifier } from './pkce';

describe('shared/pkce', () => {
	describe('getPkceVerifier', () => {
		it('should work with empty storage', async () => {
			const data = await getPkceVerifier('test');
			const repeat = await getPkceVerifier('test');

			expect(data).toEqual(repeat);
			expect(data).toHaveLength(128);
		});

		it('should work with multiple providers', async () => {
			const dataA = await getPkceVerifier('testA');
			const repeatA = await getPkceVerifier('testA');
			const dataB = await getPkceVerifier('testB');
			const repeatB = await getPkceVerifier('testB');

			expect(dataA).toEqual(repeatA);
			expect(dataA).toHaveLength(128);

			expect(dataB).toEqual(repeatB);
			expect(dataB).toHaveLength(128);

			expect(dataA).not.toEqual(dataB);
		});
	});

	describe('generateAsyncPKCE', () => {
		it('should generate a valid PKCE', async () => {
			const pkce = await generateAsyncPKCE('test');
			expect(pkce.codeVerifier).toHaveLength(128);
			expect(pkce.codeChallenge).toHaveLength(43);
			expect(pkce.codeChallengeMethod).toEqual('S256');
		});

		it('should return the same keys for the same provider', async () => {
			const pkce1 = await generateAsyncPKCE('test');
			const pkce2 = await generateAsyncPKCE('test');

			expect(pkce1.codeVerifier).toEqual(pkce2.codeVerifier);
			expect(pkce1.codeChallenge).toEqual(pkce2.codeChallenge);
			expect(pkce1.codeChallengeMethod).toEqual(pkce2.codeChallengeMethod);
		});
	});

	describe('deletePkce', () => {
		it('should regnerate the key after deletion', async () => {
			const pkce1 = await generateAsyncPKCE('test');
			await deletePkce();
			const pkce2 = await generateAsyncPKCE('test');

			expect(pkce1.codeVerifier).not.toEqual(pkce2.codeVerifier);
		});
	});
});
