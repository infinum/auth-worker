import { IAllowList } from '../interfaces/IAllowList';
import { IProvider } from '../interfaces/IProvider';
import { fetchListener } from './interceptor';
import { messageListenerWithOrigin } from './postMesage';
import { getState, saveState } from './state';
import { getConfig, log } from './utils';

export async function initAuthServiceWorker(
	providers: Record<string, IProvider>,
	allowList?: IAllowList,
	urlConfig?: string
): Promise<() => void> {
	const { config, debug } = getConfig(urlConfig);

	const scope = globalThis as unknown as ServiceWorkerGlobalScope;

	scope.addEventListener('install', (event) => {
		log('install', event);
		event.waitUntil(scope.skipWaiting());
	});

	scope.addEventListener('activate', async function (event) {
		log('Claiming control', event);

		await scope.skipWaiting();
		await scope.clients.claim();

		scope.clients.matchAll().then((clients) => {
			clients.forEach((client) => {
				client.postMessage({ type: 'ready' });
			});
		});
	});

	scope.addEventListener('fetch', fetchListener);
	scope.addEventListener('message', messageListenerWithOrigin);

	const state = await getState();
	state.config = { config, providers, debug };
	state.providers = providers;
	state.allowList = allowList;

	log('init', state.config);

	await saveState(state);

	return () => {
		scope.removeEventListener('fetch', fetchListener);
		scope.removeEventListener('message', messageListenerWithOrigin);
	};
}
