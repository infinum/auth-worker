import { IFullConfig } from 'auth-worker';
import { google } from 'auth-worker/providers';
import { CLIENT_ID } from './consts';

export const OAUTH2_CONFIG: IFullConfig = {
	config: {
		google: {
			clientId: CLIENT_ID,
			redirectUrl: '/redirect',
			scopes: 'https://www.googleapis.com/auth/userinfo.profile',
		},
	},
	providers: { google },
} as const;
