import { HttpMethod } from '../interfaces/IAllowList';
import { AuthError } from '../shared/enums';
import { getPkceVerifier } from '../shared/pkce';
import { getState } from '../shared/storage';
import { getLoginUrl } from '../utils';
import { fetchWithCredentials, isAllowedUrl } from './fetch';
import { createSession, deleteSession } from './operations';
import { getAuthState } from './state';
import { generateResponse, log } from './utils';

export async function fetchListener(event: FetchEvent) {
	const useAuth = event.request.headers.get('X-Use-Auth');
	const state = await getAuthState();

	const url = new URL(event.request.url);

	if (useAuth) {
		log('🔐 fetch', event.request.method, event.request.url);
		if (!(await isAllowedUrl(event.request.url, event.request.method as HttpMethod))) {
			return event.respondWith(generateResponse({ error: AuthError.Unauthorized }, 401));
		}

		log('🌍 fetch', event.request.method, event.request.url, { auth: Boolean(useAuth) });
		return event.respondWith(fetchWithCredentials(event.request));
	} else if (state?.config?.basePath && url.pathname.startsWith(state.config.basePath)) {
		log('🔐 intercept', event.request.method, event.request.url);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [action, provider, _rest] = url.pathname.replace(state.config.basePath, '').split('/');
		if (action === 'login') {
			const loginUrl = await getLoginUrl(state.config, provider);
			return event.respondWith(Response.redirect(loginUrl, 302));
		} else if (action === 'logout') {
			await deleteSession();
			return event.respondWith(generateResponse({}));
		} else if (action === 'callback') {
			const hash = url.hash.substring(1);
			const query = url.search.substring(1);
			const params = hash && hash.length > 10 ? hash : query;
			const localState = await getState(provider); // TODO: worker should handle this
			const pkce = getPkceVerifier(provider); // TODO: worker should handle this
			const userData = await createSession(params, provider, localState, pkce);
			return event.respondWith(generateResponse({ userData })); // TODO: redirect to original URL?
		} else {
			return event.respondWith(generateResponse({ error: AuthError.InvalidRequest }, 400));
		}
	}
}
