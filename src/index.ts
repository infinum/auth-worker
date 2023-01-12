import { IConfig } from './interfaces';

export function loadAuthWorker(workerPath = './service-worker.js', config: IConfig) {
	(navigator as Window['navigator']).serviceWorker.register(
		workerPath +
			'?' +
			new URLSearchParams({
				config: JSON.stringify(config),
			}),
		{ type: 'module' }
	);
}

export { IConfig };
