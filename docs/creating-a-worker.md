# Creating a worker

If using a service worker, create a service worker file:

```ts
// service-worker.ts
import { initAuthServiceWorker } from 'auth-worker/worker';
import { google } from 'auth-worker/providers';

addEventListener('install', (event) => {
	skipWaiting();
});

addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
});

initAuthServiceWorker({ google });
```

Otherwise, create a web worker file:

```ts
// web-worker.ts
import { initAuthWebWorker } from 'auth-worker/worker';
import { google } from 'auth-worker/providers';

initAuthWebWorker({ google });
```

For details about the init functions, check out the [init docs](API/init-the-worker.md).

---

**Next up: [load the worker](load-the-worker.md)**
