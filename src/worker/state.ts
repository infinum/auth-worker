import { IBaseConfig } from '../interfaces/IBaseConfig';
import { IFullConfig } from '../interfaces/IFullConfig';
import { IProvider } from '../interfaces/IProvider';
import { log } from './utils';

export interface IState {
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

// eslint-disable-next-line no-underscore-dangle
export function __setState(newState: IState | null = null) {
	state = newState;
}

export async function getState() {
	if (!state) {
		const match = await caches.match('state');
		state = match ? ((await match.json()) as IState) : { providers: {} };
		log('getState', state);
	}
	return { ...state }; // sructuredClone is not supported in Safari & Opera, so this will need to be good enough for now
}

export async function saveState(newState: IState) {
	const cache = await caches.open('v1');
	state = newState;
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
		throw new Error('No provider params found (getProviderParams)');
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
