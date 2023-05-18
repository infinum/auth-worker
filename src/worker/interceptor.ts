import { HttpMethod } from '../interfaces/IAllowList';
import { AuthError } from '../shared/enums';
import { checkCsrfToken } from './csrf';
import { fetchWithCredentials, isAllowedUrl } from './fetch';
import { generateResponse, log } from './utils';

export async function fetchListener(event: FetchEvent) {
	const useAuth = event.request.headers.get('X-Use-Auth');
	const csrf = event.request.headers.get('X-CSRF-Token');

	if (useAuth) {
		if (!(await isAllowedUrl(event.request.url, event.request.method as HttpMethod))) {
			return event.respondWith(generateResponse({ error: AuthError.Unauthorized }, 401));
		}

		if (event.request.method !== 'GET') {
			if (!csrf || !(await checkCsrfToken(csrf))) {
				return event.respondWith(generateResponse({ error: AuthError.InvalidCSRF }, 400));
			}
		}

		await log('fetch', event.request.method, event.request.url, { csrf: Boolean(csrf), auth: Boolean(useAuth) });
		return event.respondWith(fetchWithCredentials(event.request));
	}
}
