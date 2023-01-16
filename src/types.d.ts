declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface globalThis {
		cookieStore: {
			set: (name: string, value: string) => void;
			get: (name: string) => string;
		};
	}
}
