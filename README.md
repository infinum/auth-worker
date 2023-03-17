# auth-worker

OAuth2 Service Worker handler

## Usage

```ts
// index.ts
import { loadAuthWorker } from 'auth-worker';

loadAuthWorker(
	{
		google: {
			clientId: 'example-client-id',
			redirectUrl: '/redirect',
			scopes: 'https://www.googleapis.com/auth/userinfo.profile',
		},
	},
	'./service-worker.js'
);
```

```ts
// service-worker.ts
import { initAuthWorker } from 'auth-worker/worker';
import { google } from 'auth-worker/providers';

addEventListener('install', (event) => {
	skipWaiting();
});

addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
});

initAuthWorker({ google });
```

```tsx
// Login.tsx
import { getLoginUrl } from 'auth-worker';

export const Login = () => {
	const loginUrl = getLoginUrl(myOAuthConfig, 'google');

	return <a href={loginUrl}>Log me in!</a>;
};
```

```tsx
// Redirect.tsx
import { createSession } from 'auth-worker';

export const Redirect = () => {
	useEffect(() => {
		createSession('google').then(
			() => {
				// Redirect to the main page
			},
			(error) => {
				// Handle the error
			}
		);
	}, []);

	return <div>Redirecting...</div>;
};
```

## Configuration

| Option        | Type     | Description                                                                            |
| ------------- | -------- | -------------------------------------------------------------------------------------- |
| `clientId`    | `string` | The OAuth 2.0 Client ID                                                                |
| `redirectUrl` | `string` | The URL (within the domain) that should be used as the redirect URL. Defaults to `"/"` |
| `scopes`      | `string` | The scopes that should be requested                                                    |

## API

### Interfaces

#### `IConfig`

The config that is passed to the service worker in runtime.

```ts
type IConfig = Record<
	string,
	{
		clientId: string;
		redirectUrl?: string;
		scopes?: string;
	}
>;
```

#### `IProvider`

The interface used to define a (custom) provider.

#### `IFullConfig`

The full config that is used within the auth worker

```ts
export interface IFullConfig {
	config: IConfig<string>;
	providers: Record<string, IProvider>;
	debug?: boolean;
}
```

### `loadAuthWorker`

Loads the Auth Worker (and the whole service worker) with the specified providers - within the main app.

#### Example

```ts
// index.ts
import { loadAuthWorker } from 'auth-worker';

loadAuthWorker({
	google: {
		clientId: 'example-client-id',
		redirectUrl: '/redirect',
		scopes: 'https://www.googleapis.com/auth/userinfo.profile',
	},
});
```

#### Parameters

| Name          | Type      | Description                                                             |
| ------------- | --------- | ----------------------------------------------------------------------- |
| `providers`   | `IConfig` | The providers that should be used.                                      |
| `workerPath?` | `string`  | The location of the service worker. Defaults to `"./service-worker.js"` |
| `scope?`      | `string`  | The scope opf the service worker. Defaults to `"/"`                     |
| `debug?`      | `boolean` | Whether to enable debug mode. Defaults to `false`                       |

### `initAuthWorker`

Initializes the Auth Worker with the specified providers - within the service worker.

#### Example

```ts
// service-worker.ts
import { initAuthWorker } from 'auth-worker/worker';
import { google } from 'auth-worker/providers';

initAuthWorker({ google });
```

Returns `Promise<() => void>`

#### Parameters

| Name        | Type                        | Description                        |
| ----------- | --------------------------- | ---------------------------------- |
| `providers` | `Record<string, IProvider>` | The providers that should be used. |

### `getLoginUrl`

Returns the login URL for the specified provider.

#### Example

```tsx
import { getLoginUrl } from 'auth-worker';

const loginUrl = getLoginUrl(myOAuthConfig, 'google');

return <a href={loginUrl}>Log me in!</a>;
```

### `createSession`

Creates a session for the specified provider. This function needs to be called on the redirect URL. The URL params are read automatically within the function.

#### Example

```ts
import { createSession } from 'auth-worker';

createSession('google');
```

#### Parameters

| Name   | Type     | Description               |
| ------ | -------- | ------------------------- |
| `name` | `string` | The name of the provider. |

#### Returns

`Promise<object>` - the user info

### `getUserInfo`

Returns the user info for the current provider.

#### Example

```ts
import { getUserInfo } from 'auth-worker';

const userInfo = await getUserInfo();
```

### `deleteSession`

Deletes the session for the specified provider.

#### Example

```ts
import { deleteSession } from 'auth-worker';

deleteSession();
```

### `getCsrfToken`

Returns the CSRF token used in API calls.

#### Example

```ts
import { getCsrfToken } from 'auth-worker';

const csrfToken = await getCsrfToken();
```

## Making authenticated API calls

To make an authenticated API call, you'll need to set the `X-Use-Auth` header to `true`.

Also, if the API call method is not `GET`, you'll need to set the `X-CSRF-Token` header to the value returned by the `getCsrfToken` function.

# Credits

Published under the [MIT License](LICENSE).

Maintained and sponsored by
[Infinum](https://www.infinum.com).

<p align="center">
  <a href='https://infinum.com'>
    <picture>
        <source srcset="https://assets.infinum.com/brand/logo/static/white.svg" media="(prefers-color-scheme: dark)">
        <img src="https://assets.infinum.com/brand/logo/static/default.svg">
    </picture>
  </a>
</p>
```
