import { HttpMethod } from '../interfaces/IAllowList';
import { AuthError } from '../shared/enums';
import { getProviderOptions, getProviderParams, getState, saveState } from './state';
import { generateResponse, log } from './utils';

export async function refreshToken(): Promise<void> {
	const state = await getState();
	const providerParams = await getProviderParams();
	const providerOptions = await getProviderOptions();
	if (!providerParams?.tokenUrl || !state.session?.refreshToken) {
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
	await saveState(state);
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

export async function isAllowedUrl(url: string, method: HttpMethod): Promise<boolean> {
	const state = await getState();
	const status =
		state?.allowList?.some((item) => {
			if (typeof item === 'string') {
				return url.startsWith(item);
			} else if (item instanceof RegExp) {
				return item.test(url);
			} else if (item.url instanceof RegExp) {
				return item.url.test(url) && item.methods.includes(method);
			} else if (typeof item.url === 'string') {
				return url.startsWith(item.url) && item.methods.includes(method);
			}
			return false;
		}) ?? true;
	log('🟢 allowed', method, url, status);
	return status;
}
