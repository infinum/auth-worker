/**
 * @jest-environment jsdom
 */

import { getLoginUrl } from './login';
import { IFullConfig } from '../interfaces/IFullConfig';
import { auth0, google } from '../providers';
import { LocalStorageMock } from '../../test/mock/localStorage';

describe('getLoginUrl', () => {
	beforeAll(() => {
		global.localStorage = new LocalStorageMock();
	});

	beforeEach(() => {
		localStorage.clear();
	});

	it('should generate login URL for token flow', () => {
		const config: IFullConfig = {
			providers: {
				google,
			},
			config: {
				google: {
					clientId: 'abc123',
					redirectUrl: '/redirect',
					scopes: 'email',
				},
			},
		};

		const provider = 'google';
		const loginUrl = getLoginUrl(config, provider);
		expect(loginUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
		expect(loginUrl).toContain('client_id=abc123');
		expect(loginUrl).toContain('response_type=token');
		expect(loginUrl).toContain('state=');
		expect(loginUrl).toContain('scope=email');
		expect(loginUrl).toContain('redirect_uri=');
	});

	it('should generate login URL for PKCE flow', () => {
		const config: IFullConfig = {
			providers: {
				auth0: auth0('foobar.com'),
			},
			config: {
				auth0: {
					clientId: 'abc123',
					redirectUrl: '/redirect',
					scopes: 'email',
				},
			},
		};

		const provider = 'auth0';
		const loginUrl = getLoginUrl(config, provider);
		expect(loginUrl).toContain('https://foobar.com/authorize');
		expect(loginUrl).toContain('client_id=abc123');
		expect(loginUrl).toContain('response_type=code');
		expect(loginUrl).toContain('state=');
		expect(loginUrl).toContain('scope=email');
		expect(loginUrl).toContain('redirect_uri=');
		expect(loginUrl).toContain('code_challenge=');
		expect(loginUrl).toContain('code_challenge_method=S256');
	});
});
