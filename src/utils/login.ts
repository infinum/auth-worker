import { IFullConfig } from '../interfaces/IFullConfig';
import { GrantFlow } from '../shared/enums';
import { getState } from './storage';

export function getLoginUrl<TConfig extends IFullConfig<TKeys>, TKeys extends string = keyof IFullConfig['providers']>(
	config: TConfig,
	provider: TKeys
) {
	const providerParams = config.providers[provider];
	const providerConfig = config.config[provider];

	if (!providerParams.loginUrl) {
		throw new Error('No login URL provided');
	}
	const redirectPath = window.location.origin + providerConfig.redirectUrl;

	const url = new URL(providerParams.loginUrl);
	url.searchParams.set('client_id', providerConfig.clientId);
	url.searchParams.set('response_type', providerParams.grantType === GrantFlow.Token ? 'token' : 'code');
	url.searchParams.set('state', getState());
	url.searchParams.set('scope', providerConfig.scopes ?? '');
	url.searchParams.set('redirect_uri', redirectPath);
	return url.toString();
}
