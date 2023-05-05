import { getState, saveState } from './state';
import { getCsrfToken, checkCsrfToken } from './csrf';

jest.mock('./state');

function setMockState(csrf: string | null) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	getState.mockResolvedValue({ csrf });
}

describe('worker/csrf', () => {
	describe('getCsrfToken', () => {
		beforeEach(() => {
			jest.resetAllMocks();
		});

		it('should return a new csrf token', async () => {
			setMockState(null);
			const token = await getCsrfToken();
			expect(token).toHaveLength(32);
			expect(saveState).toHaveBeenCalled();
		});

		it('should return the existing csrf token', async () => {
			setMockState('test');
			const token = await getCsrfToken();
			expect(token).toEqual('test');
			expect(saveState).not.toHaveBeenCalled();
		});
	});

	describe('checkCsrfToken', () => {
		beforeEach(() => {
			jest.resetAllMocks();
		});

		it('should return true if the token matches', async () => {
			setMockState('test');
			const result = await checkCsrfToken('test');
			expect(result).toEqual(true);
		});

		it('should return false if the token does not match', async () => {
			setMockState('test');
			const result = await checkCsrfToken('test2');
			expect(result).toEqual(false);
		});

		it('should return false if the token is null', async () => {
			setMockState(null);
			const result = await checkCsrfToken('test');
			expect(result).toEqual(false);
		});
	});
});
