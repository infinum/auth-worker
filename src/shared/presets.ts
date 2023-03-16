import { IProvider } from '../interfaces/IProvider';
import { GrantFlow } from './enums';

export const google: IProvider = {
	loginUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
	grantType: GrantFlow.Token,
	accessTokenName: 'access_token',
	userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
	userInfoTokenName: 'id_token',
	userInfoParser(data: Record<string, unknown>) {
		return {
			id: data.sub,
			name: data.name,
			email: data.email,
			picture: data.picture,
		};
	},
};
