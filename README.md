# auth-worker

OAuth2 Service Worker handler

[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=infinum_auth-worker&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=infinum_auth-worker)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=infinum_auth-worker&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=infinum_auth-worker)
[![CodeQL](https://github.com/infinum/auth-worker/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/infinum/auth-worker/actions/workflows/github-code-scanning/codeql)
[![npm](https://img.shields.io/npm/v/auth-worker?color=limegreen)](https://www.npmjs.com/package/auth-worker)

## Motivation

When it comes to saving credentials in the browser, HttpOnly Cookies are often the preferred method as they are not vulnerable to cross-site scripting (XSS) attacks. However, when using Single Sign-On (SSO), the credentials are usually provided in the form of tokens that are intended to be sent via the Authorization header.

While it may be tempting to simply store these tokens in the browser's localStorage, this can introduce security risks if any third-party code is present or if a user is able to add custom JavaScript to the application. Storing the tokens in regular Cookies may also not be the best solution as it defeats the purpose of using Cookies in the first place.

This library is an implementation of the OAuth2 recommendations for [Single Page Applications](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps#section-6.4) that uses a Service Worker to store the tokens in SW cache, which is inaccessable to the main app.

## Getting started

To get started, check out the [getting started guide](docs/getting-started.md). The TL;DR version is:

1. Decide [which type of worker you want to use](docs/worker-types.md)
2. [Create a worker](docs/creating-a-worker.md)
3. [Load the worker](docs/load-the-worker.md)
4. [Get the login URL](docs/login-link.md)
5. [Create a session](docs/create-a-session.md)
6. [Make an API call](docs/make-an-api-call.md)
7. Use the [provided methods](docs/API/TOC.md) to manage the session

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
