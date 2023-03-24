interface IValidUserData<T = Record<string, unknown>> {
	data: T;
	provider: string;
}

export type IUserData = IValidUserData | { error: string };
