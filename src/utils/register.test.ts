/**
 * @jest-environment jsdom
 */

import { loadAuthServiceWorker } from './register';

describe('utils/register', () => {
	describe('loadAuthServiceWorker', () => {
		beforeEach(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			window.navigator.serviceWorker = {
				register: jest.fn(() => Promise.resolve()),
			};
		});

		it('should call window.navigator.serviceWorker.register with the correct arguments', async () => {
			await loadAuthServiceWorker(
				{
					google: {
						clientId: 'example-client-id',
						redirectUrl: '/test-redirect',
						scopes: 'https://www.googleapis.com/auth/userinfo.profile',
					},
				},
				{ workerPath: './test-service-worker.js', scope: '/test', debug: true }
			);
			expect(window.navigator.serviceWorker.register).toHaveBeenCalledWith(
				'./test-service-worker.js?config=%7B%22google%22%3A%7B%22clientId%22%3A%22example-client-id%22%2C%22redirectUrl%22%3A%22%2Ftest-redirect%22%2C%22scopes%22%3A%22https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%22%7D%7D&v=1&debug=1',
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
					redirectUrl: '/test-redirect',
					scopes: 'https://www.googleapis.com/auth/userinfo.profile',
				},
			});
			expect(window.navigator.serviceWorker.register).toHaveBeenCalledWith(
				'./service-worker.js?config=%7B%22google%22%3A%7B%22clientId%22%3A%22example-client-id%22%2C%22redirectUrl%22%3A%22%2Ftest-redirect%22%2C%22scopes%22%3A%22https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%22%7D%7D&v=1&debug=0',
				{
					scope: '/',
					type: 'module',
				}
			);
		});
	});
});
