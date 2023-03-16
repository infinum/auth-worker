import { callWorker } from './postMessage';

import type {
	createSession as workerCreateSession,
	getUserData as workerGetUserData,
	deleteSession as workerDeleteSession,
} from '../worker/operations';

import type { getCsrfToken as workerGetCsrfToken } from '../worker/csrf';
import { getState } from './storage';

export function createSession(provider: string) {
	const params = window.location.hash.substring(1) || window.location.search.substring(1);
	const localState = getState();
	return callWorker<typeof workerCreateSession>('createSession', [params, provider, localState]);
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
