const { setSecret, isPersistable, getData, saveData, deleteData, getKeys, SECURE_KEY } = jest.requireActual('./db');

describe('shared/db', () => {
	describe('setSecret', () => {
		it('should set secret', () => {
			const key = 'test';

			setSecret(key);

			expect(isPersistable()).toBe(true);
		});

		it('should set secret to null', () => {
			setSecret(undefined);

			expect(isPersistable()).toBe(false);
		});
	});

	describe('getData & saveData', () => {
		it('should save and get data', async () => {
			const key = 'test';
			const value = 'value';

			await saveData(key, value);

			expect(await getData(key)).toBe(value);
		});

		it('should return null if no data', async () => {
			const key = 'test';

			expect(await getData(key)).toBe(null);
		});

		it('should not save the secret key if pass is not set', async () => {
			const value = 'value';

			setSecret();
			await saveData(SECURE_KEY, value);

			expect(await getData(SECURE_KEY)).toBe(null);
		});

		it('should save the secret key', async () => {
			const key = 'test';
			const value = 'value';

			setSecret(key);
			await saveData(SECURE_KEY, value);

			expect(await getData(SECURE_KEY)).toBe(value);
		});
	});

	describe('deleteData', () => {
		it('should delete data', async () => {
			const key = 'test';
			const value = 'value';

			await saveData(key, value);
			await deleteData([key]);

			expect(await getData(key)).toBe(null);
		});
	});

	describe('getKeys', () => {
		it('should return keys', async () => {
			const key = 'test';
			const value = 'value';

			await saveData(key, value);

			expect(await getKeys()).toEqual([key]);
		});
	});
});
