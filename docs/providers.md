# Supported providers

- Google
- Facebook
- Auth0
- Reddit

## Defining a custom provider

To define a custom provider, you need to follow the following interface:

```ts
export type IProvider = ICodePreset | ITokenPreset;

interface IBasePreset {
	loginUrl?: string;
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
```

Basically, the provider can have one of three possible grant types:

- `GrantFlow.Token` - The provider will return the access token directly, without the need for an authorization code.
- `GrantFlow.AuthorizationCode` - The provider will return an authorization code that will be exchanged for an access token.
- `GrantFlow.PKCE` - The provider will return an authorization code that will be exchanged for an access token, but the request will be signed with a PKCE code.

Depending on the grant flow, the provider can have different parameters:

- `loginUrl` - The URL that will be used to redirect the user to the provider's login page.
- `userInfoUrl` - The URL that will be used to get the user info.
- `userInfoTokenName` - The name of the token that will be used to get the user info.
- `userInfoParser` - A function that will be used to parse the user info. This function will receive the user info data as an argument and should return an object with the user info. The user info data will either be the response from the `userInfoUrl` API call or the parsed value of the `userInfoTokenName` JWT token.
- `accessTokenName` - The name of the token that will be used to get the access token. Defaults to `access_token`.
- `tokenTypeName` - The name of the token type. Defaults to `token_type`.
- `refreshTokenName` - The name of the refresh token. Defaults to `refresh_token`.
- `expiresInName` - The name of the expiration time. Defaults to `expires_in`.
- `userInfoParser` - A function that will be used to parse the user info. This function will receive the user info data as an argument and should return an object with the user info. The user info data will either be the response from the `userInfoUrl` API call or the parsed value of the `userInfoTokenName` JWTtoken.
- `stateParam` - The name of the state parameter. Defaults to `state`.
- `authorizationCodeParam` - The name of the authorization code parameter. Defaults to `code`.
- `tokenUrl` - The URL that will be used to get the access token. Required for the `GrantFlow.AuthorizationCode` and `GrantFlow.PKCE` grant flows.
