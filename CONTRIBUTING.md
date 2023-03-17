# How to contribute to the project

## Reporting bugs

If you find a bug in the source code, you can help us by [submitting an issue](https://github.com/infinum/auth-worker/issues/new/choose).

## Setting up the project

1. Run `npm ci` to install all dependencies.
2. Run `npm ci` in the `example` directory to install all example dependencies.
3. Run the following two processes in parallel:
   1. `npm run dev` to build the library.
   2. in example folder, `npm run dev` to serve the example.
4. Open the example on http://localhost:5173/.
5. In the applications tab of the devtools, under the service workers section, check the "Update on reload" checkbox.
6. On each change, you'll need two refreshes - one to reinstall the service worker, and one to activate it.

## Structure

### Worker

- Register
- Interceptor
- Refresh
- Activate

### Lib / utils

- Get login URL
- Create session
- Get user data
- Get CSRF token
