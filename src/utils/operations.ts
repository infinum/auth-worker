import { callWorker } from './postMessage';

import type {
	createSession as workerCreateSession,
	getUserData as workerGetUserData,
	deleteSession as workerDeleteSession,
} from '../worker/operations';

import { deleteState, getState } from '../shared/storage';
import { deletePkce, getPkceVerifier } from '../shared/pkce';

export async function createSession(provider: string, location: Location | URL = window.location) {
	const hash = location.hash.substring(1);
	const query = location.search.substring(1);
	const params = hash && hash.length > 10 ? hash : query;
	const localState = await getState(provider);
	const pkce = await getPkceVerifier(provider);
	const response = await callWorker<typeof workerCreateSession>('createSession', [
		params,
		provider,
		localState,
		location.origin,
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
