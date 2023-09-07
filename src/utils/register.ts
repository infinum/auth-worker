import { IConfig } from '../interfaces/IConfig';
import { IWorkerSettings } from '../interfaces/IWorkerSettins';
import { setWorker, ping } from './postMessage';

export function loadAuthServiceWorker(
	config: IConfig,
	{ workerPath = './service-worker.js', scope = '/', debug = false, patchUnregister = true }: IWorkerSettings = {}
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

	if (patchUnregister) {
		workerRegistration.then((registration) => {
			registration.unregister = () => {
				throw new Error('Unregistering the service worker is not allowed in this app.');
			};
		});
	}

	const workerInstance = window.navigator.serviceWorker;

	if (workerInstance) {
		setWorker(workerInstance);

		setInterval(ping, 5000);
	}

	return workerRegistration;
}
