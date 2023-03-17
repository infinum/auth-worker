export enum GrantFlow {
	AuthorizationCode,
	Token,
}

export enum AuthError {
	InvalidState = 1,
	InvalidCSRF,
	Unauthorized,
}
