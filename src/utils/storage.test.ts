import { LocalStorageMock } from '../../test/mock/localStorage';
import { getState, deleteState } from './storage';

describe('storage', () => {
	beforeAll(() => {
		global.localStorage = new LocalStorageMock();
	});

	beforeEach(() => {
		localStorage.clear();
	});

	describe('getState', () => {
		it('should work with empty localStorage', () => {
			const data = getState('test');
			const repeat = getState('test');

			expect(data).toEqual(repeat);
			expect(data).toHaveLength(32);
		});

		it('should work with filled localStorage', () => {
			localStorage.setItem('auth-worker/state/test', 'test');
			const data = getState('test');

			expect(data).toEqual('test');
		});

		it('should work with multiple providers', () => {
			const dataA = getState('testA');
			const repeatA = getState('testA');
			const dataB = getState('testB');
			const repeatB = getState('testB');

			expect(dataA).toEqual(repeatA);
			expect(dataA).toHaveLength(32);

			expect(dataB).toEqual(repeatB);
			expect(dataB).toHaveLength(32);

			expect(dataA).not.toEqual(dataB);
		});
	});

	describe('deleteStorage', () => {
		it('should regnerate the key after deletion', () => {
			const storage1 = getState('test');
			deleteState();
			const storage2 = getState('test');

			expect(storage1).not.toEqual(storage2);
		});
	});
});
