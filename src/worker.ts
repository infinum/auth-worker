import { Error } from './enums';
import { GrantFlow } from './index';
import { IFullConfig, TFilter } from './interfaces';
import { getRandom, getState } from './utils';

function generateResponse(resp: null | Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(resp), {
		headers: { 'Content-Type': 'application/json' },
		status,
	});
}

// This code parses the config from the URL and uses it to configure the app.
const config = JSON.parse(
	decodeURIComponent(new URLSearchParams(location.search).get('config') || '{}')
) as IFullConfig;

const oauth2 = {
	accessToken: '',
	tokenType: '',
	expiresIn: 0,
	refreshToken: '',
	csrf: '',
};

/**
 * This function checks whether the url is the token url of the OAuth2 security scheme.
 * @param url The url to check.
 * @returns True if the url is the token url of the OAuth2 security scheme.
 */
const isOauth2TokenURL = (url: string): boolean => config?.tokenUrl === url;

/**
 * Checks if the provided url is an oauth2 protected resource
 * @param {string} url - The url to check
 * @returns {boolean} - True if the url is an oauth2 protected resource, false otherwise
 */
const isOauth2ProtectedResourceURL = (url: string): boolean =>
	(Object.entries(new URL(url)) as Array<[keyof TFilter, string]>).some(
		([key, value]) => config.filter?.[key] === value
	);

// This function adds an OAuth 2.0 Authorization header to requests to protected resources.
// The function returns the modified request.
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

/**
 * This code modifies the response from an Oauth2 token request to only return the payload of the response,
 * without the access_token, token_type, expires_in, or refresh_token fields.
 * The purpose of this code is to keep the access token secret.
 */
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

/**
 * Fetches the access token from the token url using the refresh token.
 * @return A promise that resolves to the response from the token url.
 */
async function getAccessToken(): Promise<Response | null> {
	return config.tokenUrl
		? fetchWithCredentials(
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
		  )
		: null;
}

/**
 * This function is used to refresh the current access token when it expires.
 * If the current response is an OAuth2 protected resource URL (i.e. a URL that requires an access token to be accessed) and
 * the response status is 401 (unauthorized), then a new access token is retrieved using the refresh token.
 * If the current response is not an OAuth2 protected resource URL or the response status is not 401, then the response is
 * returned without any changes.
 * @param request The current request
 * @param response The current response
 * @returns A promise that resolves to the response
 */
async function useRefreshToken(request: Request, response: Response): Promise<Response> {
	if (isOauth2ProtectedResourceURL(response.url) && response.status === 401 && oauth2.refreshToken) {
		await getAccessToken();
		return fetchWithCredentials(request);
	}

	return response;
}

// Fetches a request with credentials, refreshing the token if necessary.
// Returns the response.
export async function fetchWithCredentialRefresh(input: RequestInfo, init?: RequestInit): Promise<Response> {
	const request = input instanceof Request ? input : new Request(input, init);
	const response = await fetchWithCredentials(request);
	return await useRefreshToken(request, response);
}

// This code is used to exchange an access code for an access token
async function login(accessCode: string, state: string, expiresIn?: number): Promise<Response> {
	if (state !== (await getState())) {
		return generateResponse({ error: Error.InvalidState }, 400);
	}
	if (config.grantType === GrantFlow.Token) {
		oauth2.accessToken = accessCode;
		oauth2.tokenType = 'Bearer';
		oauth2.expiresIn = expiresIn || 3600;
		return generateResponse(null, 204);
	}

	const codeRequest = new Request(config.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: config.clientId,
			grant_type: 'authorization_code',
			code: accessCode,
		}),
	});

	const response = await fetch(codeRequest);
	const responseData = await response.json();
	console.log({ responseData });
	if (response.status !== 200) {
		return generateResponse(responseData, response.status);
	} else {
		oauth2.accessToken = responseData.access_token;
		oauth2.tokenType = responseData.token_type;
		oauth2.expiresIn = responseData.expires_in;
		oauth2.refreshToken = responseData.refresh_token;
		return generateResponse(null, 204);
	}
}

// This code logs out a user by clearing the oauth2 variables
function logout() {
	oauth2.accessToken = '';
	oauth2.tokenType = '';
	oauth2.expiresIn = 0;
	oauth2.refreshToken = '';
	return generateResponse(null, 204);
}

function userData() {
	if (!oauth2.accessToken) {
		return generateResponse({}, 401);
	}
	return generateResponse({}, 200);
}

/**
 * Generates a random string to use as the CSRF token for the OAuth2 flow.
 *
 * @return {Response} A response object containing the CSRF token.
 */
function csrf(): Response {
	oauth2.csrf = oauth2.csrf || getRandom();
	return generateResponse({ csrf: oauth2.csrf }, 200);
}

// This code is used to initialize the authentication worker. It is used by the
// service worker in the main application to handle login, logout, and other
// authentication-related tasks. It is exported so that it can be used by the
// service worker in the project.
export function initAuthWorker(): () => void {
	console.log('Initializing auth worker', config);
	const fetchListener = async (event: FetchEvent) => {
		// console.log(event.request.url, config);
		if (event.request.url.endsWith(`${config.urlPrefix}/login`)) {
			const payload = await event.request.json();
			return event.respondWith(await login(payload.code, payload.state, payload.expiresIn));
		} else if (event.request.url.endsWith(`${config.urlPrefix}/logout`)) {
			return event.respondWith(logout());
		} else if (event.request.url.endsWith(`${config.urlPrefix}/user-data`)) {
			return event.respondWith(userData());
		} else if (event.request.url.endsWith(`${config.urlPrefix}/csrf`)) {
			return event.respondWith(csrf());
		} else if (event.request.method !== 'GET') {
			const payload = await event.request.json();
			if (payload.csrf !== oauth2.csrf) {
				return event.respondWith(generateResponse({ error: Error.InvalidCSRF }, 400));
			}
			event.respondWith(fetchWithCredentials(event.request));
		} else {
			event.respondWith(fetchWithCredentialRefresh(event.request));
		}
	};

	const messageListener = async (event: ExtendableMessageEvent) => {
		if (event.data.type === 'login') {
			const { code, state, expiresIn } = event.data;
			return event.ports[0].postMessage(await login(code, state, expiresIn));
		} else if (event.data.type === 'logout') {
			return event.ports[0].postMessage(logout());
		} else if (event.data.type === 'user-data') {
			return event.ports[0].postMessage(userData());
		} else if (event.data.type === 'csrf') {
			return event.ports[0].postMessage(csrf());
		}
	};

	(addEventListener as ServiceWorkerGlobalScope['addEventListener'])('fetch', fetchListener);
	(addEventListener as ServiceWorkerGlobalScope['addEventListener'])('message', messageListener);
	return () => {
		(removeEventListener as ServiceWorkerGlobalScope['removeEventListener'])('fetch', fetchListener);
		(removeEventListener as ServiceWorkerGlobalScope['removeEventListener'])('message', messageListener);
	};
}
