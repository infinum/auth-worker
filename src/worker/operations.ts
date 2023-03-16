import jwtDecode from 'jwt-decode';
import { GrantFlow } from '../shared/enums';
import { state } from './state';

export async function createSession(params: string, provider: string, localState: string) {
	const parsedParams = new URLSearchParams(params);

	if (!state.config) {
		throw new Error('No config found');
	}

	const providerParams = state.config.providers?.[provider];
	const providerOptions = state.config.config?.[provider];

	if (!providerParams) {
		throw new Error('No provider params found');
	}

	const stateParam = parsedParams.get(providerParams.stateParam ?? 'state');
	if (stateParam !== localState) {
		throw new Error('Invalid state');
	}

	if (providerParams.grantType === GrantFlow.Token) {
		const expiresIn = parseInt(parsedParams.get(providerParams.expiresInName ?? 'expires_in') ?? '', 10) || 3600;
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

	if (providerParams.grantType === GrantFlow.AuthorizationCode) {
		const accessCode = parsedParams.get(providerParams.authorizationCodeParam ?? 'code');
		if (!accessCode) {
			throw new Error('No access code found');
		}
		const res = await fetch(providerParams.tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: providerOptions.clientId,
				grant_type: 'authorization_code',
				code: accessCode,
			}),
		});

		if (res.status !== 200) {
			throw new Error('Could not get token');
		}

		const response = await res.json();

		const expiresIn = response[providerParams.expiresInName ?? ''] || 3600;
		const accessToken = response[providerParams.accessTokenName ?? 'access_token'];

		if (!accessToken) {
			throw new Error('No access token found');
		}

		state.session = {
			provider,
			accessToken,
			tokenType: response[providerParams.tokenTypeName ?? 'token_type'] ?? 'Bearer',
			refreshToken: response[providerParams.refreshTokenName ?? ''],
			userInfo: response[providerParams.userInfoTokenName ?? ''],
			expiresAt: Date.now() + expiresIn * 1000,
		};
	}

	return getUserData();
}

export async function getUserData() {
	if (!state.session) {
		throw new Error('No session found');
	}

	const providerParams = state.config?.providers?.[state.session.provider];
	if (state.session.userInfo) {
		const decoded: Record<string, unknown> = jwtDecode(state.session.userInfo);
		return providerParams?.userInfoParser?.(decoded) || decoded;
	} else if (providerParams?.userInfoUrl) {
		const resp = await fetch(providerParams.userInfoUrl, {
			headers: {
				Authorization: `${state.session.tokenType} ${state.session.accessToken}`,
			},
		});
		if (resp.status !== 200) {
			throw new Error('Could not get user info');
		}
		const response = await resp.json();
		return providerParams?.userInfoParser?.(response) || response;
	}

	throw new Error('No way to get user info');
}

export function deleteSession() {
	state.session = undefined;
}
