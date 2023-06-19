import { getLoginUrl } from './login';
import { IFullConfig } from '../interfaces/IFullConfig';
import { auth0, google } from '../providers';
import { GrantFlow } from '../shared/enums';

describe('utils/login', () => {
	describe('getLoginUrl', () => {
		it('should generate login URL for token flow', async () => {
			const config: IFullConfig = {
				providers: {
					google,
				},
				config: {
					google: {
						clientId: 'abc123',
						scopes: 'email',
					},
				},
			};

			const provider = 'google';
			const loginUrl = await getLoginUrl(config, provider);
			expect(loginUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
			expect(loginUrl).toContain('client_id=abc123');
			expect(loginUrl).toContain('response_type=token');
			expect(loginUrl).toContain('state=');
			expect(loginUrl).toContain('scope=email');
			expect(loginUrl).toContain('redirect_uri=');
		});

		it('should generate login URL for PKCE flow', async () => {
			const config: IFullConfig = {
				providers: {
					auth0: auth0('foobar.com'),
				},
				config: {
					auth0: {
						clientId: 'abc123',
					},
				},
			};

			const provider = 'auth0';
			const loginUrl = await getLoginUrl(config, provider);
			expect(loginUrl).toContain('https://foobar.com/authorize');
			expect(loginUrl).toContain('client_id=abc123');
			expect(loginUrl).toContain('response_type=code');
			expect(loginUrl).toContain('state=');
			expect(loginUrl).toContain('scope=');
			expect(loginUrl).toContain('redirect_uri=');
			expect(loginUrl).toContain('code_challenge=');
			expect(loginUrl).toContain('code_challenge_method=S256');
		});

		it('should fail if ther loginUrl is not defined', () => {
			const config: IFullConfig = {
				providers: {
					// @ts-expect-error Testing a bad config
					mockProvider: {
						grantType: GrantFlow.Token,
					},
				},
				config: {
					mockProvider: {
						clientId: 'abc123',
						scopes: 'email',
					},
				},
			};

			const provider = 'mockProvider';
			expect(getLoginUrl(config, provider)).rejects.toThrowError('No login URL provided');
		});
	});
});
