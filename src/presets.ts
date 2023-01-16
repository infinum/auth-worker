import { GrantFlow, Provider } from './enums';
import { IPreset } from './interfaces';

export const presets: Record<Provider, IPreset> = {
	[Provider.Google]: {
		loginUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
		grantType: GrantFlow.Token,
	},
};
