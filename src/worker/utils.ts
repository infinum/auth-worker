import { IConfig } from '../interfaces/IConfig';
import { getAuthState } from './state';

const INSTANCE = Date.now().toString(36).slice(-4);
const scope = 'postMessage' in globalThis ? 'WW' : 'SW';

export function getConfig(data: string = location.search.slice(1)) {
	const params = new URLSearchParams(data);
	const config = JSON.parse(decodeURIComponent(params.get('config') ?? '{}')) as IConfig;
	const debug = params.get('debug') === '1';

	return { config, debug };
}

export function getHashParams(): Record<string, string> {
	const fragmentParams = new URLSearchParams(location.hash.substring(1));

	return Object.fromEntries(
		Array.from(fragmentParams.entries()).map(([key, value]) => [key, decodeURIComponent(value.replace(/\+/g, ' '))])
	);
}

export function log(...args: Array<unknown>): void {
	getAuthState().then((state) => {
		if (state.config?.debug) {
			console.log(`%c${scope}/${INSTANCE}`, 'font-weight: bold;color: red;', ...args);
		}
	});
}

export function generateResponse(resp: null | Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(resp), {
		headers: { 'Content-Type': 'application/json' },
		status,
	});
}
