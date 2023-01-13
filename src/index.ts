import { IConfig } from './interfaces';

export function loadAuthWorker(config: IConfig, workerPath = './service-worker.js', scope = '/') {
	(navigator as Window['navigator']).serviceWorker.register(
		workerPath +
			'?' +
			new URLSearchParams({
				config: JSON.stringify(config),
			}),
		{ type: 'module', scope }
	);
}

export function getState() {
	let state = localStorage.getItem('state');
	if (!state) {
		state = Math.random().toString(36);
		localStorage.setItem('state', state);
	}
	return state;
}

export { IConfig };
