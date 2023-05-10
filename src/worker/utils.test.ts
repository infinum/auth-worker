/**
 * @jest-environment jsdom
 */

import { getState } from './state';
import { getHashParams, log } from './utils';

jest.mock('./state', () => ({
	getState: jest.fn(),
}));

describe('worker/utils', () => {
	describe('getHashParams', () => {
		it('should parse a valid hash string into an object of key-value pairs', () => {
			window.location.hash = '#access_token=123&expires_in=3600&state=xyz';
			const params = getHashParams();
			expect(params).toEqual({ access_token: '123', expires_in: '3600', state: 'xyz' });
		});

		it('should return an empty object if the hash string is empty', () => {
			window.location.hash = '';
			const params = getHashParams();
			expect(params).toEqual({});
		});
	});

	describe('log', () => {
		const originalConsole = console;

		beforeEach(() => {
			globalThis.console = {
				...console,
				log: jest.fn(),
			};
		});

		afterEach(() => {
			globalThis.console = originalConsole;
		});

		it('should log to the console if debug mode is enabled', async () => {
			(getState as jest.Mock).mockResolvedValueOnce({ config: { debug: true } });
			await log('hello', 'world');
			expect(console.log).toHaveBeenCalledWith('[auth-worker]', 'hello', 'world');
		});

		it('should not log to the console if debug mode is disabled', async () => {
			(getState as jest.Mock).mockResolvedValueOnce({ config: { debug: false } });
			await log('hello', 'world');
			expect(console.log).not.toHaveBeenCalled();
		});

		it('should not log to the console if an error occurs while getting the state', async () => {
			(getState as jest.Mock).mockRejectedValueOnce(new Error('Failed to get state'));
			await log('hello', 'world');
			expect(console.log).not.toHaveBeenCalled();
		});
	});
});
