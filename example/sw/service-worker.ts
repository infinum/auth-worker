/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { initAuthWorker } from 'auth-worker/worker';
import { google } from 'auth-worker/providers';

addEventListener('install', () => {
	// @ts-ignore
	skipWaiting();
});

addEventListener('activate', (event) => {
	// @ts-ignore
	event.waitUntil(clients.claim());
});

initAuthWorker({ google });
