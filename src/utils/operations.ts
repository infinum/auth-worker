import { callWorker } from './postMessage';

import type {
	createSession as workerCreateSession,
	getUserData as workerGetUserData,
	deleteSession as workerDeleteSession,
	fetch as workerFetch,
} from '../worker/operations';

import type { getCsrfToken as workerGetCsrfToken } from '../worker/csrf';
import { deleteState, getState } from './storage';
import { deletePkce, getPkceVerifier } from '../shared/pkce';

export async function createSession(provider: string) {
	const hash = window.location.hash.substring(1);
	const query = window.location.search.substring(1);
	const params = hash && hash.length > 10 ? hash : query;
	const localState = getState(provider);
	const pkce = getPkceVerifier(provider);
	const response = await callWorker<typeof workerCreateSession>('createSession', [
		params,
		provider,
		localState,
		window.location.origin,
		pkce,
	]);
	deleteState();
	deletePkce();
	return response;
}

export function getUserData() {
	return callWorker<typeof workerGetUserData>('getUserData', []);
}

export function deleteSession() {
	return callWorker<typeof workerDeleteSession>('deleteSession', []);
}

export function getCsrfToken() {
	return callWorker<typeof workerGetCsrfToken>('getCsrfToken', []);
}

export function fetch(...args: Parameters<typeof workerFetch>) {
	return callWorker<typeof workerFetch>('fetch', args);
}
