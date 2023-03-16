import { IConfig } from '../interfaces/IConfig';
import { IProvider } from '../interfaces/IProvider';
import { fetchListener } from './interceptor';
import { messageListener } from './postMesage';
import { state } from './state';

const config = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('config') || '{}')) as IConfig;

export function initAuthWorker(providers: Record<string, IProvider>): () => void {
	state.config = {
		config,
		providers,
	};

	const scope = globalThis as unknown as ServiceWorkerGlobalScope;

	state.providers = providers;

	scope.addEventListener('fetch', fetchListener);
	scope.addEventListener('message', messageListener);

	return () => {
		scope.removeEventListener('fetch', fetchListener);
		scope.removeEventListener('message', messageListener);
	};
}
