# How to contribute to the project

## Reporting bugs

If you find a bug in the source code, you can help us by [submitting an issue](https://github.com/infinum/auth-worker/issues/new/choose).

## Setting up the project

1. Run `npm ci` to install all dependencies.
2. Run `npm ci` in the `example` directory to install all example dependencies.
3. Run the following three processes in parallel:
   1. `npm run dev` to build the library.
   2. in example folder, `npm run dev:sw` to build the example service worker.
   3. in example folder, `npm run dev` to serve the example.
4. Open the example on http://localhost:5173/.

## Structure

### Worker

- Register
- Interceptor
- Refresh
- Activate

### Lib / utils

- Get login URL
- Activate session
- Get user data
- Get CSRF token
