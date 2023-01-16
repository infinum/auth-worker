export enum Provider {
	Google = 1,
}

export enum GrantFlow {
	AuthorizationCode,
	Token,
}

export enum Error {
	InvalidState = 1,
	InvalidCSRF,
}
