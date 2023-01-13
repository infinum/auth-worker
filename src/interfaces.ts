export type TFilter = Omit<URL, 'origin' | 'toString' | 'searchParams' | 'toJSON'>;

export interface IConfig {
	clientId: string;
	tokenUrl: string;
	urlPrefix: string;
	filter?: Partial<TFilter>;
}
