import { IConfig } from '../interfaces/IConfig';
import { IWorkerSettings } from '../interfaces/IWorkerSettins';
import { setWorker, ping } from './postMessage';

export function loadAuthServiceWorker(
	config: IConfig,
	{ workerPath = './service-worker.js', scope = '/', debug = false }: IWorkerSettings = {}
) {
	const workerRegistration = window.navigator.serviceWorker.register(
		workerPath +
			'?' +
			new URLSearchParams({
				config: JSON.stringify(config),
				v: '1',
				debug: debug ? '1' : '0',
			}),
		{ type: 'module', scope }
	);

	const workerInstance = window.navigator.serviceWorker;

	if (workerInstance) {
		setWorker(workerInstance);

		setInterval(ping, 10_000);
	}

	return workerRegistration;
}
