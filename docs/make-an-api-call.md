# Making an API call

## When using Service Workers

Every call that should be processed with the Service Worker will need to have the `X-Use-Auth` header set to `true`.

## When using Web Workers

In case of web workers, you won't be able to use the built in `fetch` or `XMLHttpRequest` APIs, so you'll need to use the provided `fetch` function with the same interface and behavior as the built-in `fetch` function.

```ts
import { fetch } from 'auth-worker';

const response = await fetch('https://example.com/api', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'X-Use-Auth': 'true',
	},
	body: JSON.stringify({
		foo: 'bar',
	}),
});
```
