import { IConfig, TFilter } from './interfaces';

const config = JSON.parse(new URLSearchParams(location.search).get('config') || '{}') as IConfig;

const oauth2 = {
	accessToken: '',
	tokenType: '',
	expiresIn: 0,
	refreshToken: '',
	csrf: '',
};

const isOauth2TokenURL = (url: string): boolean => config.tokenUrl === url;
const isOauth2ProtectedResourceURL = (url: string): boolean =>
	(Object.entries(new URL(url)) as Array<[keyof TFilter, string]>).some(
		([key, value]) => config.filter?.[key] === value
	);

function modifyRequest(request: Request): Request {
	if (isOauth2ProtectedResourceURL(request.url) && oauth2.tokenType && oauth2.accessToken) {
		const headers = new Headers(request.headers);
		if (!headers.has('Authorization')) {
			headers.set('Authorization', `${oauth2.tokenType} ${oauth2.accessToken}`);
		}
		return new Request(request, { headers });
	}

	return request;
}

async function modifyResponse(response: Response): Promise<Response> {
	if (isOauth2TokenURL(response.url) && response.status === 200) {
		const { access_token, token_type, expires_in, refresh_token, ...payload } = await response.json();

		oauth2.accessToken = access_token;
		oauth2.tokenType = token_type;
		oauth2.expiresIn = expires_in;
		oauth2.refreshToken = refresh_token;

		return new Response(JSON.stringify(payload, null, 2), {
			headers: response.headers,
			status: response.status,
			statusText: response.statusText,
		});
	}

	return response;
}

export async function fetchWithCredentials(input: RequestInfo, init?: RequestInit): Promise<Response> {
	const request = input instanceof Request ? input : new Request(input, init);
	const response = await fetch(modifyRequest(request));
	return modifyResponse(response);
}

async function getAccessToken(): Promise<Response> {
	return fetchWithCredentials(
		new Request(config.tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: config.clientId,
				grant_type: 'refreshToken',
				refreshToken: oauth2.refreshToken,
			}),
		})
	);
}

async function useRefreshToken(request: Request, response: Response): Promise<Response> {
	if (isOauth2ProtectedResourceURL(response.url) && response.status === 401 && oauth2.refreshToken) {
		await getAccessToken();
		return fetchWithCredentials(request);
	}

	return response;
}

export async function fetchWithCredentialRefresh(input: RequestInfo, init?: RequestInit): Promise<Response> {
	const request = input instanceof Request ? input : new Request(input, init);
	const response = await fetchWithCredentials(request);
	return await useRefreshToken(request, response);
}

async function login(accessCode: string, _state: string): Promise<Response> {
	// if (state !== '1') {
	// 	return new Response('Invalid state', { status: 400 });
	// }
	const codeRequest = new Request(config.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: config.clientId,
			grant_type: 'accessCode',
			accessCode,
		}),
	});

	const response = await fetch(codeRequest);
	const responseData = await response.json();
	console.log({ responseData });
	if (response.status !== 200) {
		return new Response(JSON.stringify(responseData), { status: response.status });
	} else {
		oauth2.accessToken = responseData.access_token;
		oauth2.tokenType = responseData.token_type;
		oauth2.expiresIn = responseData.expires_in;
		oauth2.refreshToken = responseData.refresh_token;
		return new Response(null, { status: 204 });
	}
}

function logout() {
	oauth2.accessToken = '';
	oauth2.tokenType = '';
	oauth2.expiresIn = 0;
	oauth2.refreshToken = '';
	return new Response(null, { status: 204 });
}

function userData() {
	if (!oauth2.accessToken) {
		return new Response(null, { status: 401 });
	}
	return new Response(JSON.stringify('oauth2.accessToken'), { status: 200 });
}

function csrf() {
	oauth2.csrf = Math.random().toString(36);
	return new Response(JSON.stringify(oauth2.csrf), { status: 200 });
}

export function initAuthWorker(): () => void {
	const listener = async (event: FetchEvent) => {
		console.log(event.request.url, config);
		if (event.request.url.endsWith(`${config.urlPrefix}/login`)) {
			const payload = await event.request.json();
			return event.respondWith(await login(payload.code, payload.state));
		} else if (event.request.url.endsWith(`${config.urlPrefix}/logout`)) {
			return event.respondWith(logout());
		} else if (event.request.url.endsWith(`${config.urlPrefix}/user-data`)) {
			return event.respondWith(userData());
		} else if (event.request.url.endsWith(`${config.urlPrefix}/csrf`)) {
			return event.respondWith(csrf());
		} else if (event.request.method !== 'GET') {
			const payload = await event.request.json();
			if (payload.csrf !== oauth2.csrf) {
				return event.respondWith(new Response('Invalid CSRF token', { status: 400 }));
			}
			event.respondWith(fetchWithCredentials(event.request));
		} else {
			event.respondWith(fetchWithCredentialRefresh(event.request));
		}
	};

	(addEventListener as ServiceWorkerGlobalScope['addEventListener'])('fetch', listener);
	return () => (removeEventListener as ServiceWorkerGlobalScope['removeEventListener'])('fetch', listener);
}
