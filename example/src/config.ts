import { IConfig, Provider } from 'auth-worker';
import { CLIENT_ID } from './consts';

export const OAUTH2_CONFIG: IConfig = {
	clientId: CLIENT_ID,
	provider: Provider.Google,
	urlPrefix: '/auth',
};
