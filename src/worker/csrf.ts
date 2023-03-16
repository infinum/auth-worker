import { state } from './state';
import { getRandom } from '../shared/utils';

export function getCsrfToken() {
	if (state.csrf === null) {
		state.csrf = getRandom();
	}
	return state.csrf;
}

export function checkCsrfToken(token: string) {
	return state.csrf === token;
}
