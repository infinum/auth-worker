import { loadAuthServiceWorker } from './register';

describe('utils/register', () => {
	describe('loadAuthServiceWorker', () => {
		beforeEach(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			window.navigator.serviceWorker = {
				register: jest.fn(() =>
					Promise.resolve({
						unregister: jest.fn(),
					})
				),
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
			};
		});

		it('should call window.navigator.serviceWorker.register with the correct arguments', async () => {
			await loadAuthServiceWorker(
				{
					google: {
						clientId: 'example-client-id',
						scopes: 'https://www.googleapis.com/auth/userinfo.profile',
					},
				},
				{ workerPath: './test-service-worker.js', scope: '/test', debug: true }
			);
			expect(window.navigator.serviceWorker.register).toHaveBeenCalledWith(
				// eslint-disable-next-line max-len
				'./test-service-worker.js?config=%7B%22google%22%3A%7B%22clientId%22%3A%22example-client-id%22%2C%22scopes%22%3A%22https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%22%7D%7D&v=1&debug=1',
				{
					scope: '/test',
					type: 'module',
				}
			);
		});

		it('should work with default options', async () => {
			await loadAuthServiceWorker({
				google: {
					clientId: 'example-client-id',
					scopes: 'https://www.googleapis.com/auth/userinfo.profile',
				},
			});
			expect(window.navigator.serviceWorker.register).toHaveBeenCalledWith(
				// eslint-disable-next-line max-len
				'./service-worker.js?config=%7B%22google%22%3A%7B%22clientId%22%3A%22example-client-id%22%2C%22scopes%22%3A%22https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%22%7D%7D&v=1&debug=0',
				{
					scope: '/',
					type: 'module',
				}
			);
		});
	});
});
