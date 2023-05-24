# Load the worker

## `loadAuthWebWorker` / `loadAuthServiceWorker`

Loads the Auth Worker (and the whole web/service worker) with the specified providers - within the main app.

### Example

```ts
// index.ts
import { loadAuthServiceWorker } from 'auth-worker';

loadAuthServiceWorker({
	google: {
		clientId: 'example-client-id',
		redirectUrl: '/redirect',
		scopes: 'https://www.googleapis.com/auth/userinfo.profile',
	},
}).catch(console.error);
```

### Parameters

| Name                  | Type      | Description                                                             |
| --------------------- | --------- | ----------------------------------------------------------------------- |
| `config`              | `IConfig` | The providers that should be used.                                      |
| `options.workerPath?` | `string`  | The location of the service worker. Defaults to `"./service-worker.js"` |
| `options.scope?`      | `string`  | The scope opf the service worker. Defaults to `"/"`                     |
| `options.debug?`      | `boolean` | Whether to enable debug mode. Defaults to `false`                       |

**Next up: [Generate a login URL](login-link.md)**
