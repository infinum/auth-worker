import { IConfig } from '../interfaces/IConfig';
import { getState } from './state';

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

export async function log(...args: Array<unknown>): Promise<void> {
	try {
		const state = await getState();
		if (state.config?.debug) {
			console.log('[auth-worker]', ...args);
		}
	} catch {
		return undefined;
	}
}

export function generateResponse(resp: null | Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(resp), {
		headers: { 'Content-Type': 'application/json' },
		status,
	});
}
