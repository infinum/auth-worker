# auth-worker

OAuth2 Service Worker handler

## Usage

```ts
// index.ts
import { loadAuthWorker } from 'auth-worker';

loadAuthWorker(
	{
		clientId: 'example-client-id',
		tokenUrl: 'https://api.example.com/token',
	},
	'./service-worker.js'
);
```

```ts
// service-worker.ts
import { initAuthWorker } from 'auth-worker/worker';

addEventListener('install', (event) => {
	skipWaiting();
});

addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
});

initAuthWorker();
```

## Configuration

The configuration options are appended as query string parameters to the service worker registration. You can see [the example above](#usage) for a implementation guide.

The `filter.*` options allow you to limit which requests the credentials are added to. By default if you don't specify anything then all requests have credentials.

| Option     | Description                                                                                                      | Required |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| `clientId` | The OAuth 2.0 Client ID                                                                                          | Yes      |
| `tokenUrl` | The OAuth 2.0 Token URL                                                                                          | Yes      |
| `filter.`  | Object of keys that can be returned by the [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) API |          |

## API

### `initAuthWorker`

Add the Oauth2 Vault in the Service Worker.

#### Example

```ts
import { initAuthWorker } from 'auth-worker/worker';
initAuthWorker();
```

Returns `() => void`

### `fetchWithCredentials`

Exactly like the fetch API, except it will add and remove credentials as
specified in the query string parameters of the Service Worker.

#### Parameters

- `resource` - **string | Request** - The resource that you wish to fetch.
- `init` - _object_ - An object containing any custom settings that you want to apply to the request.

#### Example

```ts
import { fetchWithCredentials } from 'auth-worker/worker';
addEventListener('fetch', (event) => {
	event.respondWith(fetchWithCredentials(event.request));
});
```

Returns `Promise<Response>`

### `fetchWithCredentialRefresh`

Exactly like the fetch API, except it will add and remove credentials as
specified in the query string parameters of the Service Worker. If the network
request fails with a 401 Unauthorized, it will attempt to re try the request
once after exchanging the refresh token for a new access token.

#### Parameters

- `resource` - **string | Request** - The resource that you wish to fetch.
- `init` - _object_ - An object containing any custom settings that you want to apply to the request.

#### Example

```ts
import { fetchWithCredentialRefresh } from 'auth-worker/worker';
addEventListener('fetch', (event) => {
	event.respondWith(fetchWithCredentialRefresh(event.request));
});
```

Returns `Promise<Response>`

# Credits

Inspired by [aidant/lazy-oauth2-service-worker-vault](https://github.com/aidant/lazy-oauth2-service-worker-vault).

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
