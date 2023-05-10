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
			reject(new Error('Timeout'));
			navigator.serviceWorker?.removeEventListener('message', handler);
		}, TIMEOUT);

		function handler(event: MessageEvent) {
			if (event.origin !== location.origin) return;
			if (event.data.key === caller) {
				navigator.serviceWorker?.removeEventListener('message', handler);
				if (event.data.error) {
					reject(new Error(event.data.error));
				} else {
					resolve(event.data.result);
				}
				clearTimeout(timeout);
			}
		}
		navigator.serviceWorker?.addEventListener('message', handler);
		navigator.serviceWorker?.controller?.postMessage({ type: 'call', fnName, options, caller });
	});
}
