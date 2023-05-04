import { IProvider } from '../interfaces/IProvider';
import { GrantFlow } from './enums';

export const google: IProvider = {
	loginUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
	grantType: GrantFlow.Token,
	accessTokenName: 'access_token',
	userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
	userInfoParser(data: Record<string, unknown>) {
		return {
			id: data.sub,
			name: data.name,
			email: data.email,
			picture: data.picture,
		};
	},
};

export const facebook: IProvider = {
	loginUrl: 'https://www.facebook.com/v9.0/dialog/oauth',
	grantType: GrantFlow.Token,
	accessTokenName: 'access_token',
	userInfoUrl: 'https://graph.facebook.com/v9.0/me',
	userInfoParser(data: Record<string, unknown>) {
		return {
			id: data.id,
			name: data.name,
			email: data.email,
			picture: data.profile_pic,
		};
	},
};

export const twitter: IProvider = {
	loginUrl: 'https://twitter.com/i/oauth2/authorize',
	tokenUrl: 'https://api.twitter.com/oauth/access_token',
	grantType: GrantFlow.AuthorizationCode,
	authorizationCodeParam: 'oauth_verifier',
	accessTokenName: 'oauth_token',
	refreshTokenName: 'oauth_token_secret',
	userInfoUrl: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
	userInfoParser(data: Record<string, unknown>) {
		return {
			id: data.id,
			name: data.name,
			email: data.email,
			picture: data.profile_image_url_https,
		};
	},
};

export const reddit: IProvider = {
	loginUrl: 'https://www.reddit.com/api/v1/authorize',
	grantType: GrantFlow.Token,
	accessTokenName: 'access_token',
	userInfoUrl: 'https://oauth.reddit.com/api/v1/me',
	userInfoParser(data: Record<string, unknown>) {
		return {
			id: data.id,
			name: data.name,
			email: data.email,
			picture: (data.icon_img as string)?.replace(/\\&amp;/g, '&'),
		};
	},
};

export const auth0: (domain: string) => IProvider = (domain) => ({
	loginUrl: `https://${domain}/authorize`,
	tokenUrl: `https://${domain}/oauth/token`,
	grantType: GrantFlow.PKCE,
	accessTokenName: 'access_token',
	userInfoUrl: `https://${domain}/userinfo`,
	userInfoParser(data: Record<string, unknown>) {
		return {
			id: data.sub,
			name: data.name,
			email: data.email,
			picture: data.picture,
		};
	},
});
