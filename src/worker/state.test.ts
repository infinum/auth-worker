import { IState, getAuthState, saveAuthState } from './state';
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

	describe('saveAuthState', () => {
		//
	});

	describe('getProviderParams', () => {
		//
	});

	describe('getProviderOptions', () => {
		//
	});
});
