import { GrantFlow } from './enums';
import { IConfig } from './interfaces';
import { clientSendMessage, getLocalState, prepareConfig, windowMessageResponder } from './utils';

/**
 * Registers the authentication service worker
 *
 * @param config - The auth config
 * @param workerPath - The path to the service worker
 * @param scope - The scope of the service worker
 */
export function loadAuthWorker(config: IConfig, workerPath = './service-worker.js', scope = '/') {
	(navigator as Window['navigator']).serviceWorker.register(
		workerPath +
			'?' +
			new URLSearchParams({
				config: JSON.stringify(prepareConfig(config)),
				v: '1',
			}),
		{ type: 'module', scope }
	);
}
export function getLoginUrl(config: IConfig, scope: string, redirectPath = window.location.origin + '/login') {
	const fullConfig = prepareConfig(config);
	if (!fullConfig.loginUrl) {
		throw new Error('No login URL provided');
	}
	const url = new URL(fullConfig.loginUrl);
	url.searchParams.set('client_id', fullConfig.clientId);
	url.searchParams.set('response_type', fullConfig.grantType === GrantFlow.Token ? 'token' : 'code');
	url.searchParams.set('state', getLocalState());
	url.searchParams.set('scope', scope);
	url.searchParams.set('redirect_uri', redirectPath);
	return url.toString();
}

export function getHashParams(): Record<string, string> {
	const fragmentString = location.hash.substring(1);

	// Parse query string to see if page request is coming from OAuth 2.0 server.
	const params: Record<string, string> = {};
	const regex = /([^&=]+)=([^&]*)/g;
	let m;
	while ((m = regex.exec(fragmentString))) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, name, value] = m;
		params[name] = decodeURIComponent(value);
	}

	return params;
}

windowMessageResponder();

export async function login(code: string, state: string, expiresIn: number) {
	const data = await clientSendMessage('login', { code, state, expiresIn });
	if (data.error) {
		throw new Error(data.error as string);
	}
}

export { IConfig } from './interfaces';
export { GrantFlow, Provider } from './enums';
