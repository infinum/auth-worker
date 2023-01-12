export interface IConfig {
	clientId: string;
	tokenUrl: string;
	filter: {
		protocol: string;
		hostname: string;
		port: string;
		pathname: string;
		search: string;
		hash: string;
		username: string;
		password: string;
	};
}
