import { IFullConfig } from 'auth-worker';
import { google, facebook, twitter } from 'auth-worker/providers';
import { GOOGLE_CLIENT_ID, FB_CLIENT_ID, TWITTER_CLIENT_ID } from './consts';

export const OAUTH2_CONFIG: IFullConfig = {
	config: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			redirectUrl: '/redirect/google',
			scopes: 'https://www.googleapis.com/auth/userinfo.profile',
		},
		facebook: {
			clientId: FB_CLIENT_ID,
			redirectUrl: '/redirect/facebook',
		},
		twitter: {
			redirectUrl: '/redirect/twitter',
			clientId: TWITTER_CLIENT_ID,
			scopes: 'users.read',
		},
	},
	providers: { google, facebook, twitter },
} as const;
