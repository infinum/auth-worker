import { IAllowList } from '../interfaces/IAllowList';
import { IProvider } from '../interfaces/IProvider';
import { messageListener } from './postMesage';
import { getState, saveState } from './state';
import { getConfig, log } from './utils';

export async function initAuthWebWorker(
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

	const scope = globalThis as unknown as Worker;

	await log('init', state.config);

	await log('Listening for messages');
	scope.addEventListener('message', messageListener);

	return () => {
		scope.removeEventListener('message', messageListener);
	};
}
