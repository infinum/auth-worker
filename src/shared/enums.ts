export enum GrantFlow {
	AuthorizationCode,
	Token,
	PKCE,
}

export enum AuthError {
	InvalidState = 1,
	InvalidCSRF,
	Unauthorized,
}
