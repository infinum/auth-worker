import { IBaseConfig } from './IBaseConfig';

export type IConfig<TKeys extends string = string> = Record<TKeys, IBaseConfig>;
