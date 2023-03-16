import { IBaseConfig } from '../interfaces/IBaseConfig';
import { IFullConfig } from '../interfaces/IFullConfig';
import { IProvider } from '../interfaces/IProvider';

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

export const state: IState = {
	providers: {},
};

export const getProviderParams = (): IProvider => {
	if (!state.session?.provider) {
		throw new Error('No provider found');
	}
	const providerParams = state.config?.providers?.[state.session?.provider];
	if (!providerParams) {
		throw new Error('No provider params found');
	}
	return providerParams;
};

export const getProviderOptions = (): IBaseConfig => {
	if (!state.session?.provider) {
		throw new Error('No provider found');
	}
	const providerOptions = state.config?.config?.[state.session?.provider];
	if (!providerOptions) {
		throw new Error('No provider options found');
	}
	return providerOptions;
};
