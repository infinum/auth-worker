import { getRandom } from '../shared/utils';

const TIMEOUT = 30000; // 30s should be plenty of time?

let worker: ServiceWorkerContainer | Worker | null = null;

export function setWorker(newWorker: ServiceWorkerContainer | Worker) {
	worker = newWorker;
}

interface IMessagePayload<TReturnType> {
	key?: string;
	error?: string;
	response?: {
		data: ArrayBuffer;
		status: number;
		statusText: string;
		headers: Array<[string, string]>;
	};
	result: TReturnType;
}

export function ping() {
	const workerContext = worker && 'postMessage' in worker ? worker : worker?.controller;

	workerContext?.postMessage({ type: 'ping' });
}

export function callWorker<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	TCallableFunction extends (...args: any) => unknown,
	TReturnType = ReturnType<TCallableFunction>,
	TArguments = Parameters<TCallableFunction>,
>(fnName: string, options: TArguments): Promise<TReturnType> {
	const caller = getRandom();

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error('Timeout'));
			(worker?.removeEventListener as (type: string, cb: typeof handler) => void)('message', handler);
		}, TIMEOUT);

		function handler(event: MessageEvent) {
			if (!(worker instanceof Worker)) {
				if (event.origin !== location.origin) return;
			}
			const data: IMessagePayload<TReturnType> = event.data;

			if (data.key === caller) {
				(worker?.removeEventListener as (type: string, cb: typeof handler) => void)('message', handler);

				if (data.error) {
					reject(new Error(data.error));
				} else if (data.response) {
					resolve(
						new Response(data.response.data, {
							status: data.response.status,
							statusText: data.response.statusText,
							headers: new Headers(data.response.headers),
						}) as TReturnType
					);
				} else {
					resolve(data.result);
				}
				clearTimeout(timeout);
			}
		}
		(worker?.addEventListener as (type: string, cb: typeof handler) => void)('message', handler);
		const workerContext = worker && 'postMessage' in worker ? worker : worker?.controller;

		workerContext?.postMessage({ type: 'call', fnName, options, caller });
	});
}
