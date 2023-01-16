import { GrantFlow, Provider } from './enums';

export type TFilter = Omit<URL, 'origin' | 'toString' | 'searchParams' | 'toJSON'>;

interface IBaseConfig {
	clientId: string;
	urlPrefix: string;
	filter?: Partial<TFilter>;
}

interface IPresetConfig {
	provider: Provider;
}

interface ITokenPreset {
	tokenUrl?: never;
	loginUrl?: string;
	grantType: GrantFlow.Token;
}

interface ICodePreset {
	tokenUrl: string;
	loginUrl?: string;
	grantType: GrantFlow.AuthorizationCode;
}

export type IPreset = ICodePreset | ITokenPreset;

export type IConfig = (IBaseConfig & IPresetConfig) | (IBaseConfig & IPreset);
export type IFullConfig = IBaseConfig & IPreset;
