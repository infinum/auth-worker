import { IConfig } from '../interfaces/IConfig';
import { IProvider } from '../interfaces/IProvider';
import { fetchListener } from './interceptor';
import { messageListener } from './postMesage';
import { getState, saveState } from './state';
import { log } from './utils';

const params = new URLSearchParams(location.search);
const config = JSON.parse(decodeURIComponent(params.get('config') || '{}')) as IConfig;
const debug = params.get('debug') === '1';

export async function initAuthWorker(providers: Record<string, IProvider>): Promise<() => void> {
	const state = await getState();
	state.config = { config, providers, debug };
	state.providers = providers;
	saveState();

	const scope = globalThis as unknown as ServiceWorkerGlobalScope;

	log('init', state.config);

	scope.addEventListener('fetch', fetchListener);
	scope.addEventListener('message', messageListener);

	return () => {
		scope.removeEventListener('fetch', fetchListener);
		scope.removeEventListener('message', messageListener);
	};
}
