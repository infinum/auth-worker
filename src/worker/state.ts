import { IAllowList } from '../interfaces/IAllowList';
import { IBaseConfig } from '../interfaces/IBaseConfig';
import { IFullConfig } from '../interfaces/IFullConfig';
import { IProvider } from '../interfaces/IProvider';
import { SECURE_KEY, getData, isPersistable, saveData } from '../shared/db';

export interface IState {
	config?: IFullConfig;
	session?: {
		provider: keyof IFullConfig['providers'];
		accessToken: string;
		expiresAt: number;
		refreshToken?: string;
		tokenType: string;
		userInfo?: string;
	};
	allowList?: IAllowList;
}

const cachedState: IState = {};

export async function getAuthState(): Promise<IState> {
	if (!isPersistable()) {
		return cachedState;
	}
	const storedState = await getData(SECURE_KEY);
	if (!storedState) {
		saveData(SECURE_KEY, JSON.stringify(cachedState));
	}
	return storedState ? JSON.parse(storedState) : cachedState;
}

export async function saveAuthState(newState: IState) {
	if (isPersistable()) {
		return saveData(SECURE_KEY, JSON.stringify(newState));
	}
}

export const getProviderParams = async (): Promise<IProvider> => {
	const state = await getAuthState();
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
	const state = await getAuthState();
	if (!state.session?.provider) {
		throw new Error('No provider found');
	}
	const providerOptions = state.config?.config?.[state.session?.provider];
	if (!providerOptions) {
		throw new Error('No provider options found');
	}
	return providerOptions;
};
