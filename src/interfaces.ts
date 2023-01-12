export interface IConfig {
	clientId: string;
	tokenUrl: string;
	filter: Omit<URL, 'origin' | 'toString' | 'searchParams' | 'toJSON'>;
}
