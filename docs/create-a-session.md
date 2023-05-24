# Create a session

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

Also, feel free to check out the [example app](../example/).

**Next up: [Making an API call](make-an-api-call.md)**
