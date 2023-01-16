import { getHashParams, getLoginUrl, login as authLogin } from 'auth-worker';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { OAUTH2_CONFIG } from './config';

const scopes = ['https://www.googleapis.com/auth/userinfo.profile'];

function App() {
	const [activated, setActivated] = useState(false);
	const login = useCallback(
		async (code: string, state: string, expiresIn: number) => {
			await authLogin(code, state, expiresIn);
			// const resp = await fetch('/auth/login', {
			// 	method: 'POST',
			// 	body: JSON.stringify({
			// 		code,
			// 		state,
			// 		expiresIn,
			// 	}),
			// });
			// if (resp.status === 204) {
			// 	setActivated(true);
			// } else {
			// 	console.log('response', resp.status, await resp.text());
			// 	console.error('Login failed');
			// }
		},
		[setActivated]
	);
	useEffect(() => {
		const params = getHashParams();
		if (!activated && Object.keys(params).length > 0 && location.pathname === '/redirect') {
			login(params.access_token, params.state, parseInt(params.expires_in, 10)).then(() =>
				localStorage.setItem('activated', 'true')
			);
		} else if (localStorage.getItem('activated') === 'true') {
			fetch('/auth/user-data')
				.then((resp) => resp.json())
				.then(console.log);
		}
	}, [activated]);
	return (
		<div>
			<a href={getLoginUrl(OAUTH2_CONFIG, scopes.join(), location.origin + '/redirect')}>Log in</a>
		</div>
	);
}

export default App;
