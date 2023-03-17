import { getRandom } from '../shared/utils';

const STATE_PARAM_NAME = 'auth-worker/state';

export function getState(): string {
	if (!localStorage.getItem(STATE_PARAM_NAME)) {
		localStorage.setItem(STATE_PARAM_NAME, getRandom());
	}

	return localStorage.getItem(STATE_PARAM_NAME) as string;
}
