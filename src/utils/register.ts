import { IConfig } from '../interfaces/IConfig';
import { IWorkerSettings } from '../interfaces/IWorkerSettins';
import { setWorker } from './postMessage';

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

	const workerInstance = window.navigator.serviceWorker?.controller;
	if (workerInstance) {
		setWorker(workerInstance);
	}
	return workerRegistration;
}

export function loadAuthWebWorker(
	config: IConfig,
	{ workerPath = './service-worker.js', debug = false }: IWorkerSettings = {}
) {
	if (!window.Worker) {
		throw new Error('Web Workers are not supported in this browser');
	}

	const workerInstance = new Worker(
		workerPath +
			'?' +
			new URLSearchParams({
				config: JSON.stringify(config),
				v: '1',
				debug: debug ? '1' : '0',
			}),
		{ type: 'module' }
	);

	setWorker(workerInstance);
	return workerInstance;
}
