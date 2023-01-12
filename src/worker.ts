import { IConfig } from './interfaces';

const config = JSON.parse(new URLSearchParams(location.search).get('config') || '{}') as IConfig;
// @ts-expect-error URLPattern does not yet have types.
const filterUrl = new URLPattern(config.filter);

const oauth2 = {
	accessToken: '',
	tokenType: '',
	expiresIn: 0,
	refreshToken: '',
};

const isOauth2TokenURL = (url: string): boolean => config.tokenUrl === url;
const isOauth2ProtectedResourceURL = (url: string): boolean => filterUrl.test(url);

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

export function initAuthWorker(): () => void {
	const listener = (event: FetchEvent) => {
		event.respondWith(fetchWithCredentialRefresh(event.request));
	};

	(addEventListener as ServiceWorkerGlobalScope['addEventListener'])('fetch', listener);
	return () => (removeEventListener as ServiceWorkerGlobalScope['removeEventListener'])('fetch', listener);
}
