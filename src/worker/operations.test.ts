/**
 * @jest-environment node
 */

import jwtDecode from 'jwt-decode';
import { createSession, deleteSession, getUserData } from './operations';
import { getAuthState, saveAuthState } from './state';
import { GrantFlow } from '../shared/enums';

jest.mock('./state');
jest.mock('jwt-decode');

describe('worker/operations', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		jest.spyOn(globalThis, 'fetch');
		(jwtDecode as jest.Mock).mockImplementation((data) => data);
	});

	describe('createSession', () => {
		it('should fail if there is no config', async () => {
			const state = {};

			(getAuthState as jest.Mock).mockReturnValue(state);

			await expect(createSession('', 'mockProvider', '', 'http://example.com')).rejects.toThrow('No config found');
		});

		it('should fail if there is no valid providers', async () => {
			const state = { config: {} };

			(getAuthState as jest.Mock).mockReturnValue(state);

			await expect(createSession('', 'mockProvider', '', 'http://example.com')).rejects.toThrow(
				'No provider params found (createSession)'
			);
		});

		it('should fail on invalid state', async () => {
			const state = {
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {},
					},
					config: {
						mockProvider: {},
					},
				},
			};

			(getAuthState as jest.Mock).mockReturnValue(state);

			await expect(createSession('', 'mockProvider', '123', 'http://example.com')).rejects.toThrow('Invalid state');
		});

		it('should work for token flow', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							stateParam: 'state_param',
							expiresInName: 'expiresIn',
							accessTokenName: 'access',
							grantType: GrantFlow.Token,
							userInfoTokenName: 'user',
						},
					},
					config: {
						mockProvider: {},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			const result = await createSession(
				'state_param=123&expiresIn=12&access=mockAccess&user=mockUserInfo&stuff=test',
				'mockProvider',
				'123',
				'http://example.com'
			);

			expect(state.session).toEqual({
				provider: 'mockProvider',
				accessToken: 'mockAccess',
				tokenType: 'Bearer',
				refreshToken: undefined,
				expiresAt: expect.any(Number),
				userInfo: 'mockUserInfo',
			});

			expect(result).toEqual({
				provider: 'mockProvider',
				data: 'mockUserInfo',
			});
		});

		it('shuld fail for token flow if no access token was received', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							stateParam: 'state_param',
							grantType: GrantFlow.Token,
							userInfoTokenName: 'user',
						},
					},
					config: {
						mockProvider: {},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			await expect(
				createSession(
					'state_param=123&expiresIn=12&user=mockUserInfo&stuff=test',
					'mockProvider',
					'123',
					'http://example.com'
				)
			).rejects.toThrow('No access token found');
		});

		it('should work for the authorization code flow', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							stateParam: 'state_param',
							grantType: GrantFlow.AuthorizationCode,
							authorizationCodeParam: 'authCode',
							userInfoTokenName: 'user',
						},
					},
					config: {
						mockProvider: {
							clientId: '123',
						},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			(fetch as jest.Mock).mockResolvedValueOnce(
				new Response('{"access_token": "mockAccess", "user": "mockUserInfo"}', { status: 200 })
			);

			const result = await createSession(
				'state_param=123&authCode=abc&stuff=test',
				'mockProvider',
				'123',
				'http://example.com'
			);

			expect(state.session).toEqual({
				provider: 'mockProvider',
				accessToken: 'mockAccess',
				tokenType: 'Bearer',
				refreshToken: undefined,
				expiresAt: expect.any(Number),
				userInfo: 'mockUserInfo',
			});

			expect(result).toEqual({
				provider: 'mockProvider',
				data: 'mockUserInfo',
			});

			const response = (fetch as jest.Mock).mock.calls[0][1] as RequestInit;
			const params = response.body as URLSearchParams;

			expect(response.method).toBe('POST');
			expect(response.headers).toEqual({
				'Content-Type': 'application/x-www-form-urlencoded',
			});
			expect(params.get('grant_type')).toBe('authorization_code');
			expect(params.get('code')).toBe('abc');
			expect(params.get('redirect_uri')).toBe('http://example.com/foo/callback/mockProvider');
			expect(params.get('client_id')).toBe('123');
		});

		it('should fail for the authorization code flow if the token was not returned', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							stateParam: 'state_param',
							grantType: GrantFlow.AuthorizationCode,
							authorizationCodeParam: 'authCode',
							userInfoTokenName: 'user',
							accessTokenName: 'access',
						},
					},
					config: {
						mockProvider: {},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			(fetch as jest.Mock).mockResolvedValueOnce(new Response('{"user": "mockUserInfo"}', { status: 200 }));

			await expect(
				createSession('state_param=123&authCode=abc&stuff=test', 'mockProvider', '123', 'http://example.com')
			).rejects.toThrow('No access token found');
		});

		it('should fail for the authorization code flow if the server returns an error', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							stateParam: 'state_param',
							grantType: GrantFlow.AuthorizationCode,
							authorizationCodeParam: 'authCode',
							userInfoTokenName: 'user',
						},
					},
					config: {
						mockProvider: {},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			(fetch as jest.Mock).mockResolvedValueOnce(new Response('someError', { status: 403 }));

			await expect(
				createSession('state_param=123&authCode=abc&stuff=test', 'mockProvider', '123', 'http://example.com')
			).rejects.toThrow('Could not get token');
		});

		it('should fail for the authorization code flow if no code was returned', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							stateParam: 'state_param',
							grantType: GrantFlow.AuthorizationCode,
							userInfoTokenName: 'user',
						},
					},
					config: {
						mockProvider: {},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			await expect(
				createSession('state_param=123&stuff=test', 'mockProvider', '123', 'http://example.com')
			).rejects.toThrow('No access code found');
		});

		it('should work for the pkce flow', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							stateParam: 'state_param',
							grantType: GrantFlow.PKCE,
							authorizationCodeParam: 'authCode',
							userInfoTokenName: 'user',
							expiresInName: 'expiresIn',
							tokenTypeName: 'tokenType',
							refreshTokenName: 'refreshToken',
						},
					},
					config: {
						mockProvider: {
							clientId: '123',
						},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			(fetch as jest.Mock).mockResolvedValueOnce(
				new Response(
					'{"access_token": "mockAccess", "user": "mockUserInfo", "expiresIn": 321, "tokenType": "Foo", "refreshToken": "mockRefresh"}',
					{ status: 200 }
				)
			);

			const result = await createSession(
				'state_param=123&authCode=abc&stuff=test',
				'mockProvider',
				'123',
				'http://example.com',
				'mockCodeVerifier'
			);

			expect(state.session).toEqual({
				provider: 'mockProvider',
				accessToken: 'mockAccess',
				tokenType: 'Foo',
				refreshToken: 'mockRefresh',
				expiresAt: expect.any(Number),
				userInfo: 'mockUserInfo',
			});

			expect(result).toEqual({
				provider: 'mockProvider',
				data: 'mockUserInfo',
			});

			const response = (fetch as jest.Mock).mock.calls[0][1] as RequestInit;
			const params = response.body as URLSearchParams;

			expect(response.method).toBe('POST');
			expect(response.headers).toEqual({
				'Content-Type': 'application/x-www-form-urlencoded',
			});
			expect(params.get('grant_type')).toBe('authorization_code');
			expect(params.get('code')).toBe('abc');
			expect(params.get('redirect_uri')).toBe('http://example.com/foo/callback/mockProvider');
			expect(params.get('client_id')).toBe('123');
			expect(params.get('code_verifier')).toBe('mockCodeVerifier');
		});
	});

	describe('getUserData', () => {
		it('should fail if session data is missing', async () => {
			(getAuthState as jest.Mock).mockResolvedValue({});

			await expect(getUserData()).rejects.toThrow('No session found');
		});

		it('should return the local user info if it exists and parse it', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
					userInfo: 'mockUserInfo',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							userInfoParser: jest.fn((data) => data),
						},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			const result = await getUserData();

			expect(result).toEqual({
				provider: 'mockProvider',
				data: 'mockUserInfo',
			});

			expect(state.config.providers.mockProvider.userInfoParser).toHaveBeenCalledWith('mockUserInfo');
			expect(jwtDecode).toHaveBeenCalledWith('mockUserInfo');
		});

		it('should return the local user info if it exists', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
					userInfo: 'mockUserInfo',
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			const result = await getUserData();

			expect(result).toEqual({
				provider: 'mockProvider',
				data: 'mockUserInfo',
			});

			expect(jwtDecode).toHaveBeenCalledWith('mockUserInfo');
		});

		it('should return the remote user info if it exists', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
					expiresAt: Date.now() + 3600 * 1000,
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							userInfoUrl: 'https://example.com/userInfo',
							userInfoParser: jest.fn((data) => data),
						},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);
			(fetch as jest.Mock).mockResolvedValueOnce(new Response('{"foo": 1}', { status: 200 }));

			const result = await getUserData();

			expect(result).toEqual({
				provider: 'mockProvider',
				data: { foo: 1 },
				expiresAt: state.session.expiresAt,
				expiresAtDate: new Date(state.session.expiresAt),
			});

			expect(state.config.providers.mockProvider.userInfoParser).toHaveBeenCalledWith({ foo: 1 });
		});

		it('should return an error on the server error', async () => {
			const state = {
				session: {
					provider: 'mockProvider',
					expiresAt: Date.now() + 3600 * 1000,
				},
				config: {
					basePath: '/foo',
					providers: {
						mockProvider: {
							userInfoUrl: 'https://example.com/userInfo',
							userInfoParser: jest.fn((data) => data),
						},
					},
				},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);
			(fetch as jest.Mock).mockResolvedValueOnce(new Response('{"foo": 1}', { status: 404 }));

			await expect(getUserData()).rejects.toThrow('Could not get user info');
		});

		it('should fail if the provider doesnt have user data', async () => {
			const state = {
				session: {},
			};

			(getAuthState as jest.Mock).mockResolvedValue(state);

			await expect(getUserData()).rejects.toThrow('No way to get user info');
		});
	});

	describe('deleteSession', () => {
		it('should clear the state', async () => {
			const state = {
				session: {},
			};

			(getAuthState as jest.Mock).mockReturnValue(state);

			await deleteSession();

			expect(saveAuthState).toHaveBeenCalled();
			expect(state.session).toBeUndefined();
		});
	});
});
