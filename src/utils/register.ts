import { IConfig } from '../interfaces/IConfig';
import { IWorkerSettings } from '../interfaces/IWorkerSettins';

export function loadAuthWorker(
	config: IConfig,
	{ workerPath = './service-worker.js', scope = '/', debug = false }: IWorkerSettings = {}
) {
	window.navigator.serviceWorker.register(
		workerPath +
			'?' +
			new URLSearchParams({
				config: JSON.stringify(config),
				v: '1',
				debug: debug ? '1' : '0',
			}),
		{ type: 'module', scope }
	);
}
