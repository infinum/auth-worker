# auth-worker

OAuth2 Service Worker handler

[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=infinum_auth-worker&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=infinum_auth-worker)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=infinum_auth-worker&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=infinum_auth-worker)

## Motivation

When it comes to saving credentials in the browser, HttpOnly Cookies are often the preferred method as they are not vulnerable to cross-site scripting (XSS) attacks. However, when using Single Sign-On (SSO), the credentials are usually provided in the form of tokens that are intended to be sent via the Authorization header.

While it may be tempting to simply store these tokens in the browser's localStorage, this can introduce security risks if any third-party code is present or if a user is able to add custom JavaScript to the application. Storing the tokens in regular Cookies may also not be the best solution as it defeats the purpose of using Cookies in the first place.

This library is an implementation of the OAuth2 recommendations for [Single Page Applications](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps#section-6.4) that uses a Service Worker to store the tokens in SW cache, which is inaccessable to the main app.

## Usage

This example is with Google, but the lib supports multiple providers out of the box and custom providers can also be defined.

Create a service worker:

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

Load the service worker in the main app:

```ts
// index.ts
import { loadAuthWorker } from 'auth-worker';

loadAuthWorker({
	google: {
		clientId: 'example-client-id',
		redirectUrl: '/redirect',
		scopes: 'https://www.googleapis.com/auth/userinfo.profile',
	},
}).catch(console.error);
```

Generate the login URL:

```tsx
// Login.tsx
import { getLoginUrl } from 'auth-worker';

export const Login = () => {
	const loginUrl = getLoginUrl(myOAuthConfig, 'google');

	return <a href={loginUrl}>Log me in!</a>;
};
```

When the user is redirected back to the app, create a session:

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

### Configuration

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

The interface used to define a (custom) [provider](#providers).

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
}).catch(console.error);
```

#### Parameters

| Name                  | Type      | Description                                                             |
| --------------------- | --------- | ----------------------------------------------------------------------- |
| `config`              | `IConfig` | The providers that should be used.                                      |
| `options.workerPath?` | `string`  | The location of the service worker. Defaults to `"./service-worker.js"` |
| `options.scope?`      | `string`  | The scope opf the service worker. Defaults to `"/"`                     |
| `options.debug?`      | `boolean` | Whether to enable debug mode. Defaults to `false`                       |

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
