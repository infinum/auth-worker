import { IState, getAuthState, getProviderOptions, getProviderParams, saveAuthState } from './state';
import { setSecret } from '../shared/db';
import { setMockData } from '../shared/db.mock';
import { GrantFlow } from '../shared/enums';

describe('worker/state', () => {
	describe('getAuthState', () => {
		it('should return the auth state', async () => {
			setSecret('foo');

			const state = await getAuthState();

			const initialState: IState = {
				allowList: undefined,
				config: {
					basePath: '/auth',
					config: {},
					debug: false,
					providers: {
						exampleProvider: {
							grantType: GrantFlow.Token,
							loginUrl: 'https://example.com/login',
						},
					},
				},
				session: undefined,
			};

			state.allowList = undefined;
			state.config = initialState.config;
			state.session = undefined;

			setMockData(JSON.stringify(initialState));

			const newState = await getAuthState();

			expect(state).toEqual(newState);
		});

		it('should work with non-primitive data and session data', async () => {
			setSecret('foo');

			const state = await getAuthState();

			const initialState: IState = {
				allowList: undefined,
				config: {
					basePath: '/auth',
					config: {},
					debug: false,
					providers: {
						exampleProvider: {
							grantType: GrantFlow.Token,
							loginUrl: 'https://example.com/login',
							userInfoParser: (_data) => {
								return { name: 'Foo Bar' };
							},
						},
					},
				},
				session: {
					expiresAt: Date.now() + 1000,
					provider: 'exampleProvider',
					accessToken: 'mockAccessToken',
					tokenType: 'Bearer',
				},
			};

			state.allowList = undefined;
			state.config = initialState.config;
			state.session = initialState.session;

			saveAuthState(state);

			const newState = await getAuthState();

			expect(state).toEqual(newState);
		});
	});

	describe('getProviderParams', () => {
		it('should return the provider params', async () => {
			const state = await getAuthState();
			state.session = {
				provider: 'foo',
				accessToken: 'mockAccessToken',
				tokenType: 'Bearer',
				expiresAt: Date.now() + 1000,
			};
			state.config = {
				config: {},
				providers: {
					foo: {
						grantType: GrantFlow.Token,
						loginUrl: 'https://example.com/login',
					},
				},
			};

			await saveAuthState(state);

			const params = await getProviderParams();

			expect(params).toEqual({
				grantType: GrantFlow.Token,
				loginUrl: 'https://example.com/login',
			});
		});

		it('should throw if user is not logged in', async () => {
			expect(getProviderParams()).rejects.toThrow('No provider found');
		});

		it('should throw if there is no provider config', async () => {
			const state = await getAuthState();
			state.session = {
				provider: 'foo',
				accessToken: 'mockAccessToken',
				tokenType: 'Bearer',
				expiresAt: Date.now() + 1000,
			};
			state.config = {
				config: {},
				providers: {
					bar: {
						grantType: GrantFlow.Token,
						loginUrl: 'https://example.com/login',
					},
				},
			};

			await saveAuthState(state);
			expect(getProviderParams()).rejects.toThrow('No provider params found (getProviderParams)');
		});
	});

	describe('getProviderOptions', () => {
		it('should return the provider options', async () => {
			const state = await getAuthState();
			state.session = {
				provider: 'foo',
				accessToken: 'mockAccessToken',
				tokenType: 'Bearer',
				expiresAt: Date.now() + 1000,
			};
			state.config = {
				config: {
					foo: {
						clientId: 'mockClientId',
					},
				},
				providers: {},
			};

			await saveAuthState(state);

			const options = await getProviderOptions();

			expect(options).toEqual({
				clientId: 'mockClientId',
			});
		});

		it('should throw if user is not logged in', async () => {
			expect(getProviderOptions()).rejects.toThrow('No provider found');
		});

		it('should throw if there is no provider config', async () => {
			const state = await getAuthState();
			state.session = {
				provider: 'foo',
				accessToken: 'mockAccessToken',
				tokenType: 'Bearer',
				expiresAt: Date.now() + 1000,
			};
			state.config = {
				config: {
					bar: {
						clientId: 'mockClientId',
					},
				},
				providers: {},
			};

			await saveAuthState(state);
			expect(getProviderOptions()).rejects.toThrow('No provider options found');
		});
	});
});
