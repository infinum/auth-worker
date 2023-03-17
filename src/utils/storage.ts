import { getRandom } from '../shared/utils';

const STATE_PARAM_NAME = 'auth-worker/state';

function saveData(data: Record<string, unknown>) {
	globalThis.localStorage.setItem(STATE_PARAM_NAME, JSON.stringify(data));
}

function loadData(): Record<string, unknown> {
	const data = globalThis.localStorage.getItem(STATE_PARAM_NAME);
	try {
		return data ? JSON.parse(data) : {};
	} catch {
		return {};
	}
}

function getKey(key: string, defaultValue?: unknown) {
	const data = loadData();
	if (data[key]) {
		return data[key];
	} else {
		setKey(key, defaultValue);
		return defaultValue;
	}
}

function setKey(key: string, value: unknown) {
	const data = loadData();
	data[key] = value;
	saveData(data);
}

export function getState(): string {
	return getKey('state', getRandom()) as string;
}
