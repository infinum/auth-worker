import { IAllowList } from '../interfaces/IAllowList';
import { IProvider } from '../interfaces/IProvider';
import { setSecret } from '../shared/db';
import { messageListener } from './postMesage';
import { getAuthState, saveAuthState } from './state';
import { getConfig, log } from './utils';

export async function initAuthWebWorker(
	providers: Record<string, IProvider>,
	secret: string,
	allowList?: IAllowList,
	urlConfig?: string
): Promise<() => void> {
	await setSecret(secret);
	const { config, debug } = getConfig(urlConfig);
	const state = await getAuthState();
	state.config = { config, providers, debug };
	state.providers = providers;
	state.allowList = allowList;
	await saveAuthState(state);

	const scope = globalThis as unknown as Worker;

	log('init', state.config);

	log('Listening for messages');
	scope.addEventListener('message', messageListener);

	globalThis.postMessage({ type: 'ready' });

	return () => {
		scope.removeEventListener('message', messageListener);
	};
}
