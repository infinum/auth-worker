interface IValidUserData<T = Record<string, unknown>> {
	data: T;
	provider: string;
	expiresAt?: number;
	expiresAtDate?: Date;
}

export type IUserData = IValidUserData | { error: string };
