import { IConfig, IFullConfig } from './interfaces';
import { presets } from './presets';

const STATE_PARAM_NAME = 'auth-worker/state';
const TIMEOUT = 10000;

export function prepareConfig(config: IConfig): IFullConfig {
	if ('provider' in config) {
		return { ...config, ...(presets[config.provider] || {}) };
	} else {
		return config;
	}
}

function setLocalData(name: string, value: string) {
	localStorage.setItem(name, value);
}

function getLocalData(name: string): string | null {
	return localStorage.getItem(name);
}

export function windowMessageResponder() {
	navigator.serviceWorker?.addEventListener('message', (event: MessageEvent) => {
		if (!event.source) return;

		if (event.data.type === 'set') {
			setLocalData(event.data.message.name, event.data.message.value);
			event.source.postMessage({ key: event.data.key });
		} else if (event.data.type === 'get') {
			const value = getLocalData(event.data.message.name);
			event.source.postMessage({ key: event.data.key, value });
		}
	});
}

function workerSendMessage(type: string, message: Record<string, unknown>): Promise<Record<string, unknown>> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject();
		}, TIMEOUT);
		const key = getRandom();
		globalThis.addEventListener('message', (event) => {
			if (event.data.key === key) {
				resolve(event.data);
				clearTimeout(timeout);
			}
		});
		globalThis.postMessage({ type, key, message }, '*');
	});
}

export function clientSendMessage(type: string, message: Record<string, unknown>): Promise<Record<string, unknown>> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject();
		}, TIMEOUT);
		const key = getRandom();
		globalThis.navigator.serviceWorker?.addEventListener('message', (event) => {
			if (event.data.key === key) {
				resolve(event.data);
				clearTimeout(timeout);
			}
		});
		globalThis.navigator.serviceWorker?.controller?.postMessage({ type, key, message });
	});
}

export async function setData(name: string, value: string): Promise<void> {
	await workerSendMessage('set', { name, value });
}

export async function getData(name: string): Promise<string | undefined> {
	const data = await workerSendMessage('set', { name });
	if (data) {
		return data.value as string;
	}
}

export function getRandom() {
	if ('crypto' in globalThis && 'randomUUID' in globalThis.crypto) {
		return globalThis.crypto.randomUUID();
	}
	return Math.random().toString(36).slice(2);
}

export function getLocalState() {
	let state = getLocalData(STATE_PARAM_NAME);
	if (!state) {
		state = getRandom();
		setLocalData(STATE_PARAM_NAME, state);
	}
	return state;
}

export async function getState() {
	let state = await getData(STATE_PARAM_NAME);
	if (!state) {
		state = getRandom();
		await setData(STATE_PARAM_NAME, state);
	}
	return state;
}
