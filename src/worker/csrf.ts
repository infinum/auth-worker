import { getState, saveState } from './state';
import { getRandom } from '../shared/utils';

export async function getCsrfToken() {
	const state = await getState();
	if (state.csrf === null) {
		state.csrf = getRandom();
		saveState(state);
	}
	return state.csrf;
}

export async function checkCsrfToken(token: string) {
	const state = await getState();
	return state.csrf === token;
}
