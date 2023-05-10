import { getState } from './state';

export function getHashParams(): Record<string, string> {
	const fragmentParams = new URLSearchParams(location.hash.substring(1));

	return Object.fromEntries(
		Array.from(fragmentParams.entries()).map(([key, value]) => [key, decodeURIComponent(value.replace(/\+/g, ' '))])
	);
}

export function log(...args: Array<unknown>): void {
	getState().then(
		(state) => {
			if (state.config?.debug) {
				console.log('[auth-worker]', ...args);
			}
		},
		() => null
	);
}
