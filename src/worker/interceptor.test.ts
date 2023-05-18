import { AuthError } from '../shared/enums';
import { fetchListener } from './interceptor';
import { getProviderOptions, getProviderParams, getState } from './state';

jest.mock('./state');

describe('worker/interceptor', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		jest.spyOn(globalThis, 'fetch');
		(getState as jest.Mock).mockResolvedValue({
			allowList: undefined,
		});
	});

	describe('fetchListener', () => {
		it('should be ignored if the auth header is not set', async () => {
			const request = new Request('https://example.com');
			const response = await fetchListener({ request } as unknown as FetchEvent);

			expect(response).toBeUndefined();
		});

		it('should fail if CSRF is invalid on POST request', async () => {
			const respondWith = jest.fn();
			const request = new Request('https://example.com', {
				method: 'POST',
				headers: {
					'X-CSRF-Token': 'invalid',
					'X-Use-Auth': 'true',
				},
			});
			await fetchListener({ request, respondWith } as unknown as FetchEvent);

			const response = respondWith.mock.calls[0][0];
			expect(response.status).toBe(400);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(await response.json()).toEqual({ error: AuthError.InvalidCSRF });
		});

		it('should fail if CSRF is not set on POST request', async () => {
			const respondWith = jest.fn();
			const request = new Request('https://example.com', {
				method: 'POST',
				headers: {
					'X-Use-Auth': 'true',
				},
			});
			await fetchListener({ request, respondWith } as unknown as FetchEvent);

			const response = respondWith.mock.calls[0][0];
			expect(response.status).toBe(400);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(await response.json()).toEqual({ error: AuthError.InvalidCSRF });
		});

		it('should pass on the POST request with a valid CSRF token', async () => {
			const respondWith = jest.fn();
			const request = new Request('https://example.com', {
				method: 'GET',
				headers: {
					'X-Use-Auth': 'true',
					'X-CSRF-Token': 'mockCsrfToken',
				},
			});
			(getState as jest.Mock).mockResolvedValue({
				session: {
					expiresAt: Date.now() - 1000,
					refreshToken: 'mockRefreshToken',
				},
			});

			(getProviderParams as jest.Mock).mockResolvedValue({
				tokenUrl: 'https://example.com/token',
			});

			(getProviderOptions as jest.Mock).mockResolvedValue({
				clientId: 'mockClientId',
			});

			(fetch as jest.Mock).mockResolvedValueOnce(
				new Response(
					'{"access_token": "mockAccessToken", "token_type": "mockTokenType", "refresh_token": "newMockRefreshToken", "expires_in": 1234567890}',
					{ status: 200 }
				)
			);

			(fetch as jest.Mock).mockResolvedValueOnce(new Response('mockResponse', { status: 200 }));

			await fetchListener({ request, respondWith } as unknown as FetchEvent);

			const response = await respondWith.mock.calls[0][0];
			expect(response.status).toBe(200);
			expect(await response.text()).toEqual('mockResponse');
		});

		it('should pass on the GET request', async () => {
			const respondWith = jest.fn();
			const request = new Request('https://example.com', {
				method: 'GET',
				headers: {
					'X-Use-Auth': 'true',
				},
			});
			(getState as jest.Mock).mockResolvedValue({
				session: {
					expiresAt: Date.now() - 1000,
					refreshToken: 'mockRefreshToken',
				},
				csrf: 'mockCsrfToken',
			});

			(getProviderParams as jest.Mock).mockResolvedValue({
				tokenUrl: 'https://example.com/token',
			});

			(getProviderOptions as jest.Mock).mockResolvedValue({
				clientId: 'mockClientId',
			});

			(fetch as jest.Mock).mockResolvedValueOnce(
				new Response(
					'{"access_token": "mockAccessToken", "token_type": "mockTokenType", "refresh_token": "newMockRefreshToken", "expires_in": 1234567890}',
					{ status: 200 }
				)
			);

			(fetch as jest.Mock).mockResolvedValueOnce(new Response('mockResponse', { status: 200 }));

			await fetchListener({ request, respondWith } as unknown as FetchEvent);

			const response = await respondWith.mock.calls[0][0];
			expect(response.status).toBe(200);
			expect(await response.text()).toEqual('mockResponse');
		});
	});
});
