import { deleteData, getData, getKeys, saveData } from './db';
import { getRandom } from './utils';

const STATE_PARAM_NAME = 'auth-worker/state';

export async function getState(provider: string): Promise<string> {
	const param = STATE_PARAM_NAME + '/' + provider;
	let state: string | null = await getData(param);

	if (!state) {
		state = getRandom();
		await saveData(param, state);
	}

	
return state;
}

export async function deleteState() {
	const keys = await getKeys();
	const toDelete = keys.filter((key) => key.startsWith(STATE_PARAM_NAME + '/'));

	
return deleteData(toDelete);
}
