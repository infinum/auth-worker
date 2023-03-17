import { IConfig } from '../interfaces/IConfig';
import { IProvider } from '../interfaces/IProvider';
import { fetchListener } from './interceptor';
import { messageListener } from './postMesage';
import { getState } from './state';
import { log } from './utils';

const config = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('config') || '{}')) as IConfig;
const debug = new URLSearchParams(location.search).get('debug') === '1';

export async function initAuthWorker(providers: Record<string, IProvider>): Promise<() => void> {
	const state = await getState();
	state.config = {
		config,
		providers,
		debug,
	};

	const scope = globalThis as unknown as ServiceWorkerGlobalScope;

	state.providers = providers;

	log('init', state.config);

	scope.addEventListener('fetch', fetchListener);
	scope.addEventListener('message', messageListener);

	return () => {
		scope.removeEventListener('fetch', fetchListener);
		scope.removeEventListener('message', messageListener);
	};
}
