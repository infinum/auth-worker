import { getRandom } from '../shared/utils';

const STATE_PARAM_NAME = 'auth-worker/state';

export function getState(provider: string): string {
	const param = STATE_PARAM_NAME + '/' + provider;
	if (!localStorage.getItem(param)) {
		localStorage.setItem(param, getRandom());
	}

	return localStorage.getItem(param) as string;
}

export function deleteState(provider: string): void {
	const param = STATE_PARAM_NAME + '/' + provider;
	localStorage.removeItem(param);
}
