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
	const state = await getState();
	state.config = { config, providers, debug };
	state.providers = providers;
	state.allowList = allowList;
	await saveState(state);

	const scope = globalThis as unknown as ServiceWorkerGlobalScope;

	await log('init', state.config);

	scope.addEventListener('fetch', fetchListener);
	scope.addEventListener('message', messageListenerWithOrigin);

	return () => {
		scope.removeEventListener('fetch', fetchListener);
		scope.removeEventListener('message', messageListenerWithOrigin);
	};
}
