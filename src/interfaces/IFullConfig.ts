import { IConfig } from './IConfig';
import { IProvider } from './IProvider';

export interface IFullConfig<TKeys extends string = string> {
	config: IConfig<TKeys>;
	providers: Record<TKeys, IProvider>;
	debug?: boolean;
}
