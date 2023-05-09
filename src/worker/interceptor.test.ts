import { AuthError } from '../shared/enums';
import { fetchListener, fetchWithCredentials, refreshToken } from './interceptor';
import { getProviderOptions, getProviderParams, getState, saveState } from './state';

jest.mock('./state');

describe('worker/interceptor', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		jest.spyOn(globalThis, 'fetch');
	});

	describe('refreshToken', () => {
		it('should fail if no data', async () => {
			await expect(refreshToken()).rejects.toThrow('No way to refresh the token');
		});

		it('should fail on API call fail', async () => {
			(getState as jest.Mock).mockResolvedValue({
				session: {
					refreshToken: 'mockRefreshToken',
				},
			});

			(getProviderParams as jest.Mock).mockResolvedValue({
				tokenUrl: 'https://example.com/token',
			});

			(getProviderOptions as jest.Mock).mockResolvedValue({
				clientId: 'mockClientId',
			});

			(fetch as jest.Mock).mockResolvedValueOnce(new Response('mockResponse', { status: 500 }));

			await expect(refreshToken()).rejects.toThrow('Could not refresh token');
		});

		it('should work for the default case', async () => {
			const state = {
				session: {
					refreshToken: 'mockRefreshToken',
					provider: 'mockProvider',
					expiresAt: 0,
				},
			};
			(getState as jest.Mock).mockResolvedValue(state);

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

			await refreshToken();

			expect(fetch).toHaveBeenCalledWith('https://example.com/token', {
				body: new URLSearchParams({
					client_id: 'mockClientId',
					grant_type: 'refresh_token',
					refresh_token: 'mockRefreshToken',
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				method: 'POST',
			});

			expect(state.session).toEqual({
				accessToken: 'mockAccessToken',
				expiresAt: expect.any(Number),
				provider: 'mockProvider',
				tokenType: 'mockTokenType',
				refreshToken: 'newMockRefreshToken',
			});
			expect(state.session.expiresAt).toBeGreaterThan(Date.now());
			expect(saveState).toHaveBeenCalled();
		});

		it('should work if the provider has user data', async () => {
			const userInfo = {
				id: 'mockId',
				name: 'mockName',
				email: 'mockEmail',
				picture: 'mockPicture',
			};

			const state = {
				session: {
					refreshToken: 'mockRefreshToken',
					provider: 'mockProvider',
					expiresAt: 0,
				},
			};
			(getState as jest.Mock).mockResolvedValue(state);

			(getProviderParams as jest.Mock).mockResolvedValue({
				tokenUrl: 'https://example.com/token',
				userInfoTokenName: 'mockUserInfoTokenName',
			});

			(getProviderOptions as jest.Mock).mockResolvedValue({
				clientId: 'mockClientId',
			});

			(fetch as jest.Mock).mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						access_token: 'mockAccessToken',
						token_type: 'mockTokenType',
						refresh_token: 'newMockRefreshToken',
						expires_in: 1234567890,
						mockUserInfoTokenName: userInfo,
					}),
					{ status: 200 }
				)
			);

			await refreshToken();

			expect(fetch).toHaveBeenCalledWith('https://example.com/token', {
				body: new URLSearchParams({
					client_id: 'mockClientId',
					grant_type: 'refresh_token',
					refresh_token: 'mockRefreshToken',
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				method: 'POST',
			});

			expect(state.session).toEqual({
				accessToken: 'mockAccessToken',
				expiresAt: expect.any(Number),
				provider: 'mockProvider',
				tokenType: 'mockTokenType',
				refreshToken: 'newMockRefreshToken',
				userInfo,
			});
			expect(state.session.expiresAt).toBeGreaterThan(Date.now());
			expect(saveState).toHaveBeenCalled();
		});
	});

	describe('fetchWithCredentials', () => {
		it('should fail if no data', async () => {
			(getState as jest.Mock).mockResolvedValue({});

			const request = new Request('https://example.com');
			const response = await fetchWithCredentials(request);

			expect(response.status).toBe(401);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(await response.json()).toEqual({ error: AuthError.Unauthorized });
		});

		it('should fail if there is no valid session data', async () => {
			(getState as jest.Mock).mockResolvedValue({ session: { expiresAt: 0 } });
			const request = new Request('https://example.com');
			const response = await fetchWithCredentials(request);

			expect(response.status).toBe(401);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(await response.json()).toEqual({ error: AuthError.Unauthorized });
		});

		it('should fail if the API returns 401 after the token refresh', async () => {
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

			(fetch as jest.Mock).mockResolvedValueOnce(new Response('mockResponse', { status: 401 }));

			const request = new Request('https://example.com');
			const response = await fetchWithCredentials(request);

			expect(response.status).toBe(401);
		});

		it('should work for the default case', async () => {
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

			const request = new Request('https://example.com', {
				headers: {
					'X-CSRF-Token': 'mockCsrfToken',
					'X-Use-Auth': 'true',
					'Content-Type': 'foo/bar',
				},
			});
			const response = await fetchWithCredentials(request);

			expect(response.status).toBe(200);
			const reqHeaders = (fetch as jest.Mock).mock.calls[1][0].headers;
			expect(reqHeaders.get('Authorization')).toBe('mockTokenType mockAccessToken');
			expect(reqHeaders.get('Content-Type')).toBe('foo/bar');
			expect(reqHeaders.get('X-CSRF-Token')).toBeNull();
			expect(reqHeaders.get('X-Use-Auth')).toBeNull();
			expect(await response.text()).toEqual('mockResponse');
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
