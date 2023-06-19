/**
 * @jest-environment node
 */

import { AuthError } from '../shared/enums';
import { fetchWithCredentials, isAllowedUrl, refreshToken } from './fetch';
import { getProviderOptions, getProviderParams, getAuthState, saveAuthState } from './state';

jest.mock('./state');

describe('worker/fetch', () => {
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
			(getAuthState as jest.Mock).mockResolvedValue({
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
			(getAuthState as jest.Mock).mockResolvedValue(state);

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
			expect(saveAuthState).toHaveBeenCalled();
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
			(getAuthState as jest.Mock).mockResolvedValue(state);

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
			expect(saveAuthState).toHaveBeenCalled();
		});
	});

	describe('fetchWithCredentials', () => {
		it('should fail if no data', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({});

			const request = new Request('https://example.com');
			const response = await fetchWithCredentials(request);

			expect(response.status).toBe(401);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(await response.json()).toEqual({ error: AuthError.Unauthorized });
		});

		it('should fail if there is no valid session data', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({ session: { expiresAt: 0 } });
			const request = new Request('https://example.com');
			const response = await fetchWithCredentials(request);

			expect(response.status).toBe(401);
			expect(response.headers.get('Content-Type')).toBe('application/json');
			expect(await response.json()).toEqual({ error: AuthError.Unauthorized });
		});

		it('should fail if the API returns 401 after the token refresh', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({
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
			(getAuthState as jest.Mock).mockResolvedValue({
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
					'X-Use-Auth': 'true',
					'Content-Type': 'foo/bar',
				},
			});
			const response = await fetchWithCredentials(request);

			expect(response.status).toBe(200);
			const reqHeaders = (fetch as jest.Mock).mock.calls[1][0].headers;
			expect(reqHeaders.get('Authorization')).toBe('mockTokenType mockAccessToken');
			expect(reqHeaders.get('Content-Type')).toBe('foo/bar');
			expect(reqHeaders.get('X-Use-Auth')).toBeNull();
			expect(await response.text()).toEqual('mockResponse');
		});
	});

	describe('isAllowedUrl', () => {
		it('should allow all if unset', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({});

			expect(await isAllowedUrl('https://example.com', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.org', 'GET')).toBe(true);
		});

		it('should disallow all if unknown value', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({
				allowList: [123],
			});

			expect(await isAllowedUrl('https://example.com', 'GET')).toBe(false);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'GET')).toBe(false);
			expect(await isAllowedUrl('https://example.org', 'GET')).toBe(false);
		});

		it('should allow all methods with string', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({
				allowList: ['https://example.com'],
			});

			expect(await isAllowedUrl('https://example.com', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.com', 'POST')).toBe(true);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.org', 'POST')).toBe(false);
		});

		it('should allow all methods with string path', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({
				allowList: ['https://example.com/foo'],
			});

			expect(await isAllowedUrl('https://example.com', 'GET')).toBe(false);
			expect(await isAllowedUrl('https://example.com', 'POST')).toBe(false);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.org', 'POST')).toBe(false);
		});

		it('should allow all methods with regex', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({
				allowList: [new RegExp('https://example.')],
			});

			expect(await isAllowedUrl('https://example.com', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.com', 'POST')).toBe(true);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.org', 'POST')).toBe(true);
			expect(await isAllowedUrl('https://infinum.com', 'POST')).toBe(false);
		});

		it('should allow specic methods with string path', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({
				allowList: [{ url: 'https://example.com/foo', methods: ['GET', 'PUT'] }],
			});

			expect(await isAllowedUrl('https://example.com', 'GET')).toBe(false);
			expect(await isAllowedUrl('https://example.com', 'POST')).toBe(false);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'POST')).toBe(false);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'PUT')).toBe(true);
			expect(await isAllowedUrl('https://example.org', 'POST')).toBe(false);
		});

		it('should allow specic methods with regex', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({
				allowList: [{ url: new RegExp('https://example.'), methods: ['GET', 'PUT'] }],
			});

			expect(await isAllowedUrl('https://example.com', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.com', 'POST')).toBe(false);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'GET')).toBe(true);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'POST')).toBe(false);
			expect(await isAllowedUrl('https://example.com/foo/bar', 'PUT')).toBe(true);
			expect(await isAllowedUrl('https://example.org', 'POST')).toBe(false);
		});
	});
});
