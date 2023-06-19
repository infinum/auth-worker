import { GrantFlow } from '../shared/enums';

interface IBasePreset {
	loginUrl: string;
	userInfoUrl?: string;
	userInfoTokenName?: string;
	accessTokenName?: string;
	tokenTypeName?: string;
	refreshTokenName?: string;
	expiresInName?: string;
	userInfoParser?: (data: Record<string, unknown>) => object;
	grantType: GrantFlow;
	stateParam?: string;
	authorizationCodeParam?: string;
}

interface ITokenPreset extends IBasePreset {
	tokenUrl?: never;
	grantType: GrantFlow.Token;
}

interface ICodePreset extends IBasePreset {
	tokenUrl: string;
	grantType: GrantFlow.AuthorizationCode | GrantFlow.PKCE;
}

export type IProvider = ICodePreset | ITokenPreset;
