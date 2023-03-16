import { getRandom } from '../shared/utils';

const TIMEOUT = 30000; // 30s should ber plenty of time?

export function callWorker<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	TCallableFunction extends (...args: any) => unknown,
	TReturnType = ReturnType<TCallableFunction>,
	TArguments = Parameters<TCallableFunction>
>(fnName: string, options: TArguments): Promise<TReturnType> {
	const caller = getRandom();
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject();
		}, TIMEOUT);

		function handler(event: MessageEvent) {
			if (event.data.key === caller) {
				resolve(event.data);
				clearTimeout(timeout);
			}
		}
		navigator.serviceWorker?.addEventListener('message', handler);
		globalThis.postMessage({ type: 'call', fnName, options, caller }, '*');
	});
}
