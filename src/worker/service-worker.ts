import { IAllowList } from '../interfaces/IAllowList';
import { IProvider } from '../interfaces/IProvider';
import { setSecret } from '../shared/db';
import { fetchListener } from './interceptor';
import { messageListenerWithOrigin } from './postMesage';
import { getAuthState, saveAuthState } from './state';
import { getConfig, log } from './utils';

export async function initAuthServiceWorker(
	providers: Record<string, IProvider>,
	basePath?: string,
	allowList?: IAllowList,
	secret?: string,
	urlConfig?: string
): Promise<() => void> {
	const scope = globalThis as unknown as ServiceWorkerGlobalScope;

	setSecret(secret);
	const { config, debug } = getConfig(urlConfig);
	getAuthState().then((state) => {
		console.log('set config');
		state.config = { config, providers, debug, basePath };
		state.allowList = allowList;

		log('init', state.config);
		return saveAuthState(state);
	});

	scope.addEventListener('install', (event) => {
		log('install', event);
		event.waitUntil(scope.skipWaiting());
	});

	scope.addEventListener('activate', function (event) {
		log('Claiming control', event);

		scope
			.skipWaiting()
			.then(() => scope.clients.claim())
			.then(() => scope.clients.matchAll())
			.then((clients) => {
				clients.forEach((client) => {
					client.postMessage({ type: 'ready' });
				});
			})
			.catch(console.error);
	});

	scope.addEventListener('fetch', fetchListener);
	scope.addEventListener('message', messageListenerWithOrigin);

	return () => {
		scope.removeEventListener('fetch', fetchListener);
		scope.removeEventListener('message', messageListenerWithOrigin);
	};
}
