import { AuthError } from '../shared/enums';
import { checkCsrfToken } from './csrf';
import { getProviderOptions, getProviderParams, state } from './state';

function generateResponse(resp: null | Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(resp), {
		headers: { 'Content-Type': 'application/json' },
		status,
	});
}

export async function refreshToken(): Promise<void> {
	const providerParams = getProviderParams();
	const providerOptions = getProviderOptions();
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
			grant_type: 'refreshToken',
			refreshToken: state.session.refreshToken,
		}),
	});

	if (resp.status !== 200) {
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
}

export async function fetchWithCredentials(request: Request): Promise<Response> {
	if (!state.session) {
		return generateResponse({ error: AuthError.Unauthorized }, 401);
	} else if (state.session.expiresAt < Date.now()) {
		try {
			await refreshToken();
		} catch {
			return generateResponse({ error: AuthError.Unauthorized }, 401);
		}
	}

	const updatedRequest = new Request(request, {
		headers: {
			...request.headers,
			Authorization: `${state.session.tokenType} ${state.session.accessToken}`,
			'X-CSRF-Token': undefined,
			'X-Use-Auth': undefined,
		},
	});
	const response = await fetch(updatedRequest);
	if (response.status === 401) {
		try {
			await refreshToken();
		} catch {
			return generateResponse({ error: AuthError.Unauthorized }, 401);
		}
	}
	return response;
}

export async function fetchListener(event: FetchEvent) {
	if (event.request.method !== 'GET') {
		const csrf = event.request.headers.get('X-CSRF-Token');
		if (!csrf || !checkCsrfToken(csrf)) {
			return event.respondWith(generateResponse({ error: AuthError.InvalidCSRF }, 400));
		}
	}

	if (event.request.headers.get('X-Use-Auth')) {
		return event.respondWith(fetchWithCredentials(event.request));
	}
}
