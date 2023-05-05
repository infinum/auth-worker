import { GrantFlow } from '../shared/enums';
import { getState, saveState, getProviderParams, getProviderOptions, __setState, IState } from './state';

describe('worker/state', () => {
	describe('getState', () => {
		beforeEach(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			globalThis.caches = {
				match: jest.fn(),
			};
			jest.clearAllMocks();
			__setState();
		});

		it('should return a default state object if no cached data exists', async () => {
			jest.spyOn(globalThis.caches, 'match').mockResolvedValue(undefined);

			const result = await getState();

			expect(globalThis.caches.match).toHaveBeenCalledWith('state');
			expect(result).toEqual({ providers: {} });
		});

		it('should return the cached state object if it exists', async () => {
			const cachedState = {
				providers: {
					exampleProvider: {
						name: 'Example Provider',
						clientId: 'exampleClientId',
						authorizationEndpoint: 'https://example.com/authorize',
						tokenEndpoint: 'https://example.com/token',
					},
				},
			};
			jest.spyOn(globalThis.caches, 'match').mockResolvedValue(new Response(JSON.stringify(cachedState)));

			const result = await getState();

			expect(globalThis.caches.match).toHaveBeenCalledWith('state');
			expect(result).toEqual(cachedState);
		});
	});

	describe('saveState', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			__setState();
		});

		it('should save the state to cache', async () => {
			const cacheMock = {
				put: jest.fn(),
			};
			globalThis.caches.open = jest.fn().mockResolvedValue(cacheMock);

			const state: IState = {
				csrf: 'csrfToken',
				config: {
					debug: false,
					providers: {
						exampleProvider: {
							grantType: GrantFlow.Token,
						},
					},
					config: {
						exampleProvider: {
							clientId: 'exampleClientId',
							redirectUrl: 'https://example.com/redirect',
						},
					},
				},
				session: {
					provider: 'exampleProvider',
					accessToken: 'accessToken',
					expiresAt: 1234567890,
					refreshToken: 'refreshToken',
					tokenType: 'Bearer',
					userInfo: '{"sub":"1234567890","name":"John Doe","email":"john.doe@example.com"}',
				},
				providers: {
					exampleProvider: {
						grantType: GrantFlow.Token,
					},
				},
			};

			__setState(state);
			await saveState();

			expect(global.caches.open).toHaveBeenCalledWith('v1');
			expect(cacheMock.put).toHaveBeenCalledTimes(1);
			await cacheMock.put.mock.calls[0][1].text().then((text: string) => {
				expect(text).toEqual(JSON.stringify(state));
			});
		});
	});

	describe('provider', () => {
		let mockState: {
			session?: unknown;
			config: {
				providers: Record<string, unknown>;
				config: Record<string, unknown>;
			};
		};

		beforeEach(() => {
			mockState = {
				session: { provider: 'google' },
				config: {
					providers: {
						google: { clientId: 'google-client-id' },
					},
					config: {
						google: { scope: 'profile email' },
					},
				},
			};

			jest.resetModules();
			__setState(mockState as unknown as IState);
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		describe('getProviderParams', () => {
			it('returns provider params if provider is found in state', async () => {
				const providerParams = await getProviderParams();
				expect(providerParams).toEqual({ clientId: 'google-client-id' });
			});

			it('throws error if provider is not found in state', async () => {
				mockState.session = {};
				await expect(getProviderParams()).rejects.toThrow('No provider found');
			});

			it('throws error if provider params are not found in config', async () => {
				delete mockState.config.providers.google;
				await expect(getProviderParams()).rejects.toThrow('No provider params found');
			});
		});

		describe('getProviderOptions', () => {
			it('returns provider options if provider is found in state', async () => {
				const providerOptions = await getProviderOptions();
				expect(providerOptions).toEqual({ scope: 'profile email' });
			});

			it('throws error if provider is not found in state', async () => {
				mockState.session = {};
				await expect(getProviderOptions()).rejects.toThrow('No provider found');
			});

			it('throws error if provider options are not found in config', async () => {
				delete mockState.config.config.google;
				await expect(getProviderOptions()).rejects.toThrow('No provider options found');
			});
		});
	});
});
