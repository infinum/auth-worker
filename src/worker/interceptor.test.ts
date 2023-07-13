/**
 * @jest-environment node
 */

import { GrantFlow } from '../shared/enums';
import { fetchListener } from './interceptor';
import { createSession, deleteSession } from './operations';
import { getProviderOptions, getProviderParams, getAuthState } from './state';

jest.mock('./state');
jest.mock('./operations');

describe('worker/interceptor', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		jest.spyOn(globalThis, 'fetch');
		(getAuthState as jest.Mock).mockResolvedValue({
			allowList: undefined,
		});
	});

	describe('fetchListener', () => {
		it('should be ignored if the auth header is not set', async () => {
			const respondWith = jest.fn();
			const request = new Request('https://example.com');
			const response = await fetchListener({ request, respondWith } as unknown as FetchEvent);

			expect(response).toBeUndefined();
			(fetch as jest.Mock).mockResolvedValueOnce('mockResponse');

			const mockResp = await respondWith.mock.calls[0][0];

			expect(mockResp).toEqual('mockResponse');
		});

		it('should pass on the GET request', async () => {
			const respondWith = jest.fn();
			const request = new Request('https://example.com', {
				method: 'GET',
				headers: {
					'X-Use-Auth': 'true',
				},
			});

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
					// eslint-disable-next-line max-len
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

	describe('intercept', () => {
		it('should redirect to the login URL', async () => {
			const respondWith = jest.fn();
			const state = await getAuthState();

			state.config = {
				basePath: '/foobar',
				config: {
					foo: {
						clientId: 'fooClientId',
					},
				},
				debug: false,
				providers: {
					foo: {
						grantType: GrantFlow.Token,
						loginUrl: 'https://example.com/login',
					},
				},
			};

			await fetchListener({
				request: {
					method: 'GET',
					headers: new Headers({}),
					url: 'https://example.com/foobar/login/foo',
				},
				respondWith,
			} as unknown as FetchEvent);

			const response = await respondWith.mock.calls[0][0];

			const location = response.headers.get('location');

			expect(location.startsWith('https://example.com/login?client_id=fooClientId&response_type=token&state='))
				.toBe(true);
			expect(location.endsWith('&scope=&redirect_uri=https%3A%2F%2Fexample.com%2Ffoobar%2Fcallback%2Ffoo'))
				.toBe(true);
			expect(response.status).toBe(302);
		});

		it('should handle the callback URL', async () => {
			const respondWith = jest.fn();
			const state = await getAuthState();

			state.config = {
				basePath: '/foobar',
				config: {
					foo: {
						clientId: 'fooClientId',
					},
				},
				debug: false,
				providers: {
					foo: {
						grantType: GrantFlow.Token,
						loginUrl: 'https://example.com/login',
					},
				},
			};

			await fetchListener({
				request: {
					method: 'GET',
					headers: new Headers({}),
					url: 'https://example.com/foobar/callback/foo#foobartest123',
				},
				respondWith,
			} as unknown as FetchEvent);

			const response = await respondWith.mock.calls[0][0];

			expect(response.headers.get('location')).toBe('https://example.com/#/');
			expect(response.status).toBe(302);
			expect(createSession).toHaveBeenCalledWith(
				'foobartest123',
				'foo',
				expect.stringMatching(/[a-z0-9]{16}/),
				expect.stringMatching(/[a-z0-9]{128}/)
			);
		});

		it('should handle the logout URL', async () => {
			const respondWith = jest.fn();
			const state = await getAuthState();

			state.config = {
				basePath: '/foobar',
				config: {
					foo: {
						clientId: 'fooClientId',
					},
				},
				debug: false,
				providers: {
					foo: {
						grantType: GrantFlow.Token,
						loginUrl: 'https://example.com/login',
					},
				},
			};

			await fetchListener({
				request: {
					method: 'GET',
					headers: new Headers({}),
					url: 'https://example.com/foobar/logout',
				},
				respondWith,
			} as unknown as FetchEvent);

			const response = await respondWith.mock.calls[0][0];

			expect(response.headers.get('location')).toBe('https://example.com/');
			expect(response.status).toBe(302);
			expect(deleteSession).toHaveBeenCalled();
		});

		it('should handle 404', async () => {
			const respondWith = jest.fn();
			const state = await getAuthState();

			state.config = {
				basePath: '/foobar',
				config: {
					foo: {
						clientId: 'fooClientId',
					},
				},
				debug: false,
				providers: {
					foo: {
						grantType: GrantFlow.Token,
						loginUrl: 'https://example.com/login',
					},
				},
			};

			await fetchListener({
				request: {
					method: 'GET',
					headers: new Headers({}),
					url: 'https://example.com/foobar/test',
				},
				respondWith,
			} as unknown as FetchEvent);

			const response = await respondWith.mock.calls[0][0];

			expect(response.headers.get('location')).toBe('https://example.com/');
			expect(response.status).toBe(302);
		});

		it('should ignore other URLs', async () => {
			const respondWith = jest.fn();
			const state = await getAuthState();

			state.config = {
				basePath: '/foobar',
				config: {
					foo: {
						clientId: 'fooClientId',
					},
				},
				debug: false,
				providers: {
					foo: {
						grantType: GrantFlow.Token,
						loginUrl: 'https://example.com/login',
					},
				},
			};

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			global.fetch = jest.fn(() => Promise.resolve('mockResponse'));

			await fetchListener({
				request: new Request('https://example.com/baz/test'),
				respondWith,
			} as unknown as FetchEvent);

			const response = await respondWith.mock.calls[0][0];

			expect(response).toBe('mockResponse');
		});
	});
});
