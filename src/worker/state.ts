import { IBaseConfig } from '../interfaces/IBaseConfig';
import { IFullConfig } from '../interfaces/IFullConfig';
import { IProvider } from '../interfaces/IProvider';
import { log } from './utils';

interface IState {
	csrf?: string;
	config?: IFullConfig;
	session?: {
		provider: keyof IState['providers'];
		accessToken: string;
		expiresAt: number;
		refreshToken?: string;
		tokenType: string;
		userInfo?: string;
	};
	providers: Record<string, IProvider>;
}

let state: IState | null = null;

export async function getState() {
	if (!state) {
		const match = await caches.match('state');
		state = match ? ((await match.json()) as IState) : { providers: {} };
		log('getState', state);
	}
	return state;
}

export async function saveState() {
	const cache = await caches.open('v1');
	log('saveState', state);
	await cache.put('state', new Response(JSON.stringify(state)));
}

export const getProviderParams = async (): Promise<IProvider> => {
	const state = await getState();
	if (!state.session?.provider) {
		throw new Error('No provider found');
	}
	const providerParams = state.config?.providers?.[state.session?.provider];
	if (!providerParams) {
		throw new Error('No provider params found');
	}
	return providerParams;
};

export const getProviderOptions = async (): Promise<IBaseConfig> => {
	const state = await getState();
	if (!state.session?.provider) {
		throw new Error('No provider found');
	}
	const providerOptions = state.config?.config?.[state.session?.provider];
	if (!providerOptions) {
		throw new Error('No provider options found');
	}
	return providerOptions;
};
