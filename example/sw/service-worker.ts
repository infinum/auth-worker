/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { initAuthWorker } from 'auth-worker/worker';
import { google, facebook, twitter, reddit, auth0 } from 'auth-worker/providers';

addEventListener('install', () => {
	// @ts-ignore
	skipWaiting();
});

addEventListener('activate', (event) => {
	// @ts-ignore
	event.waitUntil(clients.claim());
});

initAuthWorker({ google, facebook, twitter, reddit, auth0: auth0('dev-u8csbbr8zashh2k8.us.auth0.com') });
