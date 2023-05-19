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

	const workerInstance = window.navigator.serviceWorker;
	if (workerInstance) {
		setWorker(workerInstance);
	}

	const readyPromise = new Promise((resolve, reject) => {
		workerInstance.addEventListener('message', (event) => {
			if (event.data.type === 'ready') {
				setWorker(workerInstance);
				resolve(workerInstance);
			}
		});

		workerInstance.addEventListener('error', (event) => {
			reject(event);
		});
	});

	return Promise.race([readyPromise, workerRegistration]);
}

export function loadAuthWebWorker(
	config: IConfig,
	{ workerPath = './service-worker.js', debug = false }: IWorkerSettings = {}
) {
	return new Promise((resolve, reject) => {
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

		workerInstance.addEventListener('message', (event) => {
			if (event.data.type === 'ready') {
				setWorker(workerInstance);
				resolve(workerInstance);
			}
		});

		workerInstance.addEventListener('error', (event) => {
			reject(event.error);
		});
	});
}
