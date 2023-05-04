import { getRandom } from './utils';

describe('utils', () => {
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
	});
});
