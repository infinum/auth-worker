import jwtDecode from 'jwt-decode';
import { IUserData } from '../interfaces/IUserData';
import { AuthError, GrantFlow } from '../shared/enums';
import { getState, saveState } from './state';
import { generateResponse, log } from './utils';
import { fetchWithCredentials, isAllowedUrl } from './fetch';
import { HttpMethod } from '../interfaces/IAllowList';

export async function createSession(params: string, provider: string, localState: string, host: string, pkce?: string) {
	const state = await getState();
	const parsedParams = new URLSearchParams(params);

	if (!state.config) {
		throw new Error('No config found');
	}

	const providerParams = state.config.providers?.[provider];
	const providerOptions = state.config.config?.[provider];

	if (!providerParams) {
		throw new Error('No provider params found (createSession)');
	}

	const stateParam = parsedParams.get(providerParams.stateParam ?? 'state');
	if (stateParam !== localState) {
		throw new Error('Invalid state');
	}

	if (providerParams.grantType === GrantFlow.Token) {
		const expiresIn = parseInt(parsedParams.get(providerParams.expiresInName ?? 'expires_in') ?? '', 10) ?? 3600;
		const accessToken = parsedParams.get(providerParams.accessTokenName ?? 'access_token');
		if (!accessToken) {
			throw new Error('No access token found');
		}
		state.session = {
			provider,
			accessToken,
			userInfo: providerParams.userInfoTokenName
				? parsedParams.get(providerParams.userInfoTokenName) ?? undefined
				: undefined,
			tokenType: parsedParams.get(providerParams.tokenTypeName ?? 'token_type') ?? 'Bearer',
			expiresAt: Date.now() + expiresIn * 1000,
		};
	}

	if (providerParams.grantType === GrantFlow.AuthorizationCode || providerParams.grantType === GrantFlow.PKCE) {
		const accessCode = parsedParams.get(providerParams.authorizationCodeParam ?? 'code');
		if (!accessCode) {
			throw new Error('No access code found');
		}
		const res = await globalThis.fetch(providerParams.tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: providerOptions.clientId,
				grant_type: 'authorization_code',
				code: accessCode,
				code_verifier: pkce ?? '',
				redirect_uri: host + providerOptions.redirectUrl,
			}),
		});

		if (res.status !== 200) {
			throw new Error('Could not get token');
		}

		const response = await res.json();

		const expiresIn = response[providerParams.expiresInName ?? ''] ?? 3600;
		const accessToken = response[providerParams.accessTokenName ?? 'access_token'];

		if (!accessToken) {
			throw new Error('No access token found');
		}

		state.session = {
			provider,
			accessToken,
			tokenType: response[providerParams.tokenTypeName ?? 'token_type'] ?? 'Bearer',
			refreshToken: response[providerParams.refreshTokenName ?? 'refresh_token'],
			userInfo: response[providerParams.userInfoTokenName ?? ''],
			expiresAt: Date.now() + expiresIn * 1000,
		};
	}

	await saveState(state);
	return getUserData();
}

export async function getUserData(): Promise<IUserData> {
	const state = await getState();
	if (!state.session) {
		await log('state', state);
		throw new Error('No session found');
	}

	const providerParams = state.config?.providers?.[state.session.provider];
	if (state.session.userInfo) {
		const decoded: Record<string, unknown> = jwtDecode(state.session.userInfo);
		return {
			provider: state.session.provider,
			data: (providerParams?.userInfoParser?.(decoded) ?? decoded) as Record<string, unknown>,
		};
	} else if (providerParams?.userInfoUrl) {
		const request = new Request(providerParams.userInfoUrl);
		const resp = await fetchWithCredentials(request);
		if (resp.status !== 200) {
			throw new Error('Could not get user info');
		}
		const response = await resp.json();
		return {
			data: (providerParams?.userInfoParser?.(response) ?? response) as Record<string, unknown>,
			provider: state.session.provider,
			expiresAt: state.session.expiresAt,
			expiresAtDate: new Date(state.session.expiresAt),
		};
	}

	throw new Error('No way to get user info');
}

export async function deleteSession() {
	const state = await getState();
	state.session = undefined;
	await saveState(state);
}

export async function fetch(info: RequestInfo, init?: RequestInit): Promise<Response> {
	const request = new Request(info, init);
	if (!(await isAllowedUrl(request.url, request.method as HttpMethod))) {
		return generateResponse({ error: AuthError.Unauthorized }, 401);
	}
	return fetchWithCredentials(request);
}
