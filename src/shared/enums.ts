export enum GrantFlow {
	AuthorizationCode,
	Token,
	PKCE,
}

export enum AuthError {
	InvalidState = 1,
	InvalidRequest,
	Unauthorized,
}
