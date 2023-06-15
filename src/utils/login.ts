import { IFullConfig } from '../interfaces/IFullConfig';
import { GrantFlow } from '../shared/enums';
import { generateAsyncPKCE } from '../shared/pkce';
import { getState } from '../shared/storage';

export async function getLoginUrl<
	TConfig extends IFullConfig<TKeys>,
	TKeys extends string = keyof IFullConfig['providers']
>(config: TConfig, provider: TKeys, origin: string = window.location.origin) {
	const providerParams = config.providers[provider];
	const providerConfig = config.config[provider];

	if (!providerParams.loginUrl) {
		throw new Error('No login URL provided');
	}
	const redirectPath = origin + providerConfig.redirectUrl;

	const url = new URL(providerParams.loginUrl);
	url.searchParams.set('client_id', providerConfig.clientId);
	url.searchParams.set('response_type', providerParams.grantType === GrantFlow.Token ? 'token' : 'code');
	url.searchParams.set('state', await getState(provider));
	url.searchParams.set('scope', providerConfig.scopes ?? '');
	url.searchParams.set('redirect_uri', redirectPath);

	if (providerParams.grantType === GrantFlow.PKCE) {
		const pkce = await generateAsyncPKCE(provider);
		url.searchParams.set('code_challenge', pkce.codeChallenge);
		url.searchParams.set('code_challenge_method', pkce.codeChallengeMethod);
	}
	return url.toString();
}
