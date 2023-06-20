import { getRandom } from './utils';

describe('shared/utils', () => {
	describe('getRandom', () => {
		it('should return a random string', () => {
			const result = getRandom();
			expect(result.length).toEqual(32);
		});

		it('should return multiple unique strings', () => {
			const TEST_COUNT = 100;

			const results = new Set<string>();
			for (let i = 0; i < TEST_COUNT; i++) {
				results.add(getRandom());
			}

			expect(results.size).toEqual(TEST_COUNT);
		});

		it('should work with the crypto API', () => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete globalThis.crypto;

			globalThis.crypto = {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				randomUUID: jest.fn(() => '123-456'),
			};

			const result = getRandom();
			expect(result).toBe('12345612345612345612345612345612');
			expect(globalThis.crypto.randomUUID).toHaveBeenCalledTimes(6);
		});
	});
});
