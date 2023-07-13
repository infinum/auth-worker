import { getAuthState } from './state';
import { getHashParams, log } from './utils';

jest.mock('./state', () => ({
	getAuthState: jest.fn(),
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

		it('should work for params with special cases', () => {
			window.location.hash = 'test=foo=bar&baz&fooBar=rock+%26%20roll';
			const params = getHashParams();

			expect(params).toEqual({
				test: 'foo=bar',
				baz: '',
				fooBar: 'rock & roll',
			});
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

		it('should log the arguments if debug is enabled in the state', async () => {
			const mockState = Promise.resolve({ config: { debug: true } });

			(getAuthState as jest.Mock).mockReturnValueOnce(mockState);

			log('Test Log');

			await mockState;
			expect(getAuthState).toHaveBeenCalled();
			expect(console.log)
				.toHaveBeenCalledWith(expect.stringMatching(/%cWW\/\w{4}/), expect.any(String), 'Test Log');
		});

		it('should not log the arguments if debug is disabled in the state', async () => {
			const mockState = Promise.resolve({ config: { debug: false } });

			(getAuthState as jest.Mock).mockReturnValueOnce(mockState);

			log('Test Log');

			await mockState;
			expect(getAuthState).toHaveBeenCalled();
			expect(console.log).not.toHaveBeenCalled();
		});
	});
});
