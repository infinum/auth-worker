import { IConfig } from '../interfaces/IConfig';

/**
 * Registers the authentication service worker
 *
 * @param config - The auth config
 * @param workerPath - The path to the service worker
 * @param scope - The scope of the service worker
 */
export function loadAuthWorker(config: IConfig, workerPath = './service-worker.js', scope = '/') {
	(navigator as Window['navigator']).serviceWorker.register(
		workerPath +
			'?' +
			new URLSearchParams({
				config: JSON.stringify(config),
				v: '1',
			}),
		{ type: 'module', scope }
	);
}
