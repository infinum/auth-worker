import { IConfig } from '../interfaces/IConfig';
import { IProvider } from '../interfaces/IProvider';
import { fetchListener } from './interceptor';
import { messageListener } from './postMesage';
import { getState, saveState } from './state';
import { log } from './utils';

function getConfig(data: string = location.search.slice(1)) {
	const params = new URLSearchParams(data);
	const config = JSON.parse(decodeURIComponent(params.get('config') ?? '{}')) as IConfig;
	const debug = params.get('debug') === '1';

	return { config, debug };
}

export async function initAuthWorker(providers: Record<string, IProvider>, urlConfig?: string): Promise<() => void> {
	const { config, debug } = getConfig(urlConfig);
	const state = await getState();
	state.config = { config, providers, debug };
	state.providers = providers;
	await saveState(state);

	const scope = globalThis as unknown as ServiceWorkerGlobalScope;

	log('init', state.config);

	scope.addEventListener('fetch', fetchListener);
	scope.addEventListener('message', messageListener);

	return () => {
		scope.removeEventListener('fetch', fetchListener);
		scope.removeEventListener('message', messageListener);
	};
}
