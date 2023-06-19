# auth-worker

OAuth2 Service Worker handler

[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=infinum_auth-worker&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=infinum_auth-worker)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=infinum_auth-worker&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=infinum_auth-worker)
[![CodeQL](https://github.com/infinum/auth-worker/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/infinum/auth-worker/actions/workflows/github-code-scanning/codeql)
[![npm](https://img.shields.io/npm/v/auth-worker?color=limegreen)](https://www.npmjs.com/package/auth-worker)

# Motivation

When it comes to saving credentials in the browser, HttpOnly Cookies are often the preferred method as they are not vulnerable to cross-site scripting (XSS) attacks. However, when using Single Sign-On (SSO), the credentials are usually provided in the form of tokens that are intended to be sent via the Authorization header.

While it may be tempting to simply store these tokens in the browser's localStorage, this can introduce security risks if any third-party code is present or if a user is able to add custom JavaScript to the application. Storing the tokens in regular Cookies may also not be the best solution as it defeats the purpose of using Cookies in the first place.

This library is an implementation of the OAuth2 recommendations for [Single Page Applications](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps#section-6.4) that uses a Service Worker to store the tokens in SW cache, which is inaccessable to the main app.

# Getting started

1. [Installation](#installation)
2. [Create the service worker](#create-the-service-worker)
3. [Load the service worker](#load-the-service-worker)
4. [Use the auth](#use-the-auth)

## Installation

```bash
npm install auth-worker
```

## Create the service worker

_Note: This example shows usage with Google, but the lib supports [multiple providers](docs/providers.md) out of the box and [custom providers](docs/providers.md) can also be defined._

```ts
// service-worker.ts
import { initAuthServiceWorker } from 'auth-worker/worker';
import { google } from 'auth-worker/providers';

initAuthServiceWorker({ google }, '/auth', ['/allowed', '/routes']);
```

### Parameters

| Name        | Type                                                                                                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers` | `Record<string, IProvider>`                                                                                                       | The providers that should be used.                                                                                                                                                                                                                                                                                                                                                                                                |
| `path`      | `string`                                                                                                                          | The path that will be used for the auth endpoints. This should be a path that isn't used for anythin else, so altrough `/auth` might be the obvious choice, you might need to use something else in your app.                                                                                                                                                                                                                     |
| `allowlist` | `Array<RegExp \| string \| { url: RegExp \| string; methods: Array<'GET' \| 'POST' \| 'PATCH' \| 'PUT' \| 'HEAD' \| 'DELETE'> }>` | The allowlist of URLs. Everything is allowed if the array is not passed.                                                                                                                                                                                                                                                                                                                                                          |
| `secret`    | `string?`                                                                                                                         | The secret that will be used as an base for the storage encription. If not set, nothing will be persisted and the login will only work while the service worker is active (in-memory storage). This is the only secure option. If you want better UX and can afford a bit weaker security (basically, security trough obscurity), you can define a secret key here that will be used to encrypt data when writing it to IndexedDB |

## Load the service worker

```ts
// index.ts
import { loadAuthServiceWorker } from 'auth-worker';

loadAuthServiceWorker({
	google: {
		clientId: 'example-client-id',
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

## Use the auth

_Note: The examples here are using the `/auth` prefix, but this can be changed in the `initAuthServiceWorker` function._

- To log in, use the link in format `/auth/login/{provider}`. For example, `/auth/login/google`. After the successful login, the user will be redirected to `/`.
- To log out, use the `/auth/logout` link. After the successful logout, the user will be redirected to `/`.
- To get the user info, use the `getUserInfo` function. For example:

```ts
import { getUserInfo } from 'auth-worker';

const userInfo = await getUserInfo();
```

- To make an authenticated API call, make sure the wanted API endpoint is allowed in the `initAuthServiceWorker` function and add the `X-Use-Auth` header to the request. For example:

```ts
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
