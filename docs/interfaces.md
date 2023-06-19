# Interfaces

## `IConfig`

The config that is passed to the service worker in runtime.

```ts
type IConfig = Record<
	string,
	{
		clientId: string;
		scopes?: string;
	}
>;
```

## `IProvider`

The interface used to define a (custom) [provider](#providers).

## `IFullConfig`

The full config that is used within the auth worker

```ts
export interface IFullConfig {
	config: IConfig<string>;
	providers: Record<string, IProvider>;
	debug?: boolean;
}
```
