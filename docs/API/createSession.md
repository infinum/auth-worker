# `createSession`

Creates a session for the specified provider. This function needs to be called on the redirect URL. The URL params are read automatically within the function.

## Example

```ts
import { createSession } from 'auth-worker';

createSession('google');
```

## Parameters

| Name   | Type     | Description               |
| ------ | -------- | ------------------------- |
| `name` | `string` | The name of the provider. |

## Returns

`Promise<object>` - the user info
