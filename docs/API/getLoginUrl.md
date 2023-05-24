# `getLoginUrl`

Returns the login URL for the specified provider.

## Example

```tsx
import { getLoginUrl } from 'auth-worker';

const loginUrl = getLoginUrl(myOAuthConfig, 'google');

return <a href={loginUrl}>Log me in!</a>;
```
