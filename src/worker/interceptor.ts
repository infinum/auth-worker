import { HttpMethod } from '../interfaces/IAllowList';
import { AuthError } from '../shared/enums';
import { fetchWithCredentials, isAllowedUrl } from './fetch';
import { generateResponse, log } from './utils';

export async function fetchListener(event: FetchEvent) {
	const useAuth = event.request.headers.get('X-Use-Auth');

	if (useAuth) {
		log('🔐 fetch', event.request.method, event.request.url);
		if (!(await isAllowedUrl(event.request.url, event.request.method as HttpMethod))) {
			return event.respondWith(generateResponse({ error: AuthError.Unauthorized }, 401));
		}

		log('🌍 fetch', event.request.method, event.request.url, { auth: Boolean(useAuth) });
		return event.respondWith(fetchWithCredentials(event.request));
	}
}
