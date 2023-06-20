import { getState, deleteState } from './storage';

describe('utils/storage', () => {
	describe('getState', () => {
		it('should work with empty localStorage', async () => {
			const data = await getState('test');
			const repeat = await getState('test');

			expect(data).toEqual(repeat);
			expect(data).toHaveLength(32);
		});

		it('should work with multiple providers', async () => {
			const dataA = await getState('testA');
			const repeatA = await getState('testA');
			const dataB = await getState('testB');
			const repeatB = await getState('testB');

			expect(dataA).toEqual(repeatA);
			expect(dataA).toHaveLength(32);

			expect(dataB).toEqual(repeatB);
			expect(dataB).toHaveLength(32);

			expect(dataA).not.toEqual(dataB);
		});
	});

	describe('deleteStorage', () => {
		it('should regnerate the key after deletion', async () => {
			const storage1 = await getState('test');
			await deleteState();
			const storage2 = await getState('test');

			expect(storage1).not.toEqual(storage2);
		});
	});
});
