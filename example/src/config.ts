import { IFullConfig } from 'auth-worker';
import { google, facebook, twitter, reddit, auth0 } from 'auth-worker/providers';
import { GOOGLE_CLIENT_ID, FB_CLIENT_ID, TWITTER_CLIENT_ID, REDDIT_CLIENT_ID, AUTH0_CLIENT_ID } from './consts';

export const OAUTH2_CONFIG: IFullConfig = {
	config: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			scopes: 'https://www.googleapis.com/auth/userinfo.profile',
		},
		facebook: {
			clientId: FB_CLIENT_ID,
			scopes: 'public_profile,email',
		},
		twitter: {
			clientId: TWITTER_CLIENT_ID,
			scopes: 'users.read',
		},
		reddit: {
			clientId: REDDIT_CLIENT_ID,
			scopes: 'identity',
		},
		auth0: {
			clientId: AUTH0_CLIENT_ID,
			scopes: 'openid profile email offline_access',
		},
	},
	providers: { google, facebook, twitter, reddit, auth0: auth0('dev-u8csbbr8zashh2k8.us.auth0.com') },
} as const;
