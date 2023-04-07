import { AuthError } from '../shared/enums';
import { checkCsrfToken } from './csrf';
import { getProviderOptions, getProviderParams, getState, saveState } from './state';
import { log } from './utils';

function generateResponse(resp: null | Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(resp), {
		headers: { 'Content-Type': 'application/json' },
		status,
	});
}

export async function refreshToken(): Promise<void> {
	const state = await getState();
	const providerParams = await getProviderParams();
	const providerOptions = await getProviderOptions();
	if (!providerParams || !providerParams?.tokenUrl || !state.session?.refreshToken) {
		throw new Error('No way to refresh the token');
	}

	const resp = await fetch(providerParams.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: providerOptions.clientId,
			grant_type: 'refresh_token',
			refresh_token: state.session.refreshToken,
		}),
	});

	if (resp.status !== 200) {
		console.log(await resp.text());
		throw new Error('Could not refresh token');
	}

	const response = await resp.json();

	state.session = {
		provider: state.session.provider,
		accessToken: response.access_token,
		tokenType: response.token_type,
		refreshToken: response.refresh_token,
		expiresAt: Date.now() + response.expires_in * 1000,
	};

	if (providerParams.userInfoTokenName) {
		state.session.userInfo = response[providerParams.userInfoTokenName];
	}
	saveState();
}

export async function fetchWithCredentials(request: Request): Promise<Response> {
	const state = await getState();
	const unauthorized = generateResponse({ error: AuthError.Unauthorized }, 401);
	if (!state.session) {
		return unauthorized;
	} else if (state.session.expiresAt < Date.now()) {
		try {
			await refreshToken();
		} catch {
			return unauthorized;
		}
	}

	const cleanHeaders = new Headers(request.headers);
	cleanHeaders.delete('X-CSRF-Token');
	cleanHeaders.delete('X-Use-Auth');
	cleanHeaders.append('Authorization', `${state.session.tokenType} ${state.session.accessToken}`);
	const updatedRequest = new Request(request, { headers: cleanHeaders });
	const response = await fetch(updatedRequest);
	if (response.status === 401) {
		try {
			await refreshToken();
		} catch {
			return unauthorized;
		}
	}
	return response;
}

export async function fetchListener(event: FetchEvent) {
	const useAuth = event.request.headers.get('X-Use-Auth');
	const csrf = event.request.headers.get('X-CSRF-Token');

	if (useAuth) {
		if (event.request.method !== 'GET') {
			if (!csrf || !(await checkCsrfToken(csrf))) {
				return event.respondWith(generateResponse({ error: AuthError.InvalidCSRF }, 400));
			}
		}

		log('fetch', event.request.method, event.request.url, { csrf: Boolean(csrf), auth: Boolean(useAuth) });
		return event.respondWith(fetchWithCredentials(event.request));
	}
}
