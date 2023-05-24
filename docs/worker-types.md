## Service Worker or Web Worker?

The library can be used with either a Service Worker or a Web Worker. The main difference is that with the Service Worker, you can use the built-in fetch or XMLHttpRequest APIs to make authenticated API calls, while with the Web Worker, you'll need to use the provided `fetch` function.

On the other hand, the Web Worker are easier to work with and there is a smaller chance of breaking something related to caching.
As a rule of thumb, if you don't need to use the built-in fetch or XMLHttpRequest APIs, use the Web Worker. Otherwise, use the Service Worker.
