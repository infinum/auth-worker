import { initAuthWebWorker } from 'auth-worker/worker';
import { google, facebook, twitter, reddit, auth0 } from 'auth-worker/providers';

initAuthWebWorker(
	{ google, facebook, twitter, reddit, auth0: auth0('dev-u8csbbr8zashh2k8.us.auth0.com') },
	'foobartest',
	['https://www.googleapis.com/oauth2/v3/userinfo']
);

console.log('Worker ready!');
