import { getState } from 'auth-worker';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { CLIENT_ID } from './consts';

const scopes = ['https://www.googleapis.com/auth/userinfo.profile'];

function App() {
	const [activated, setActivated] = useState(false);
	const login = useCallback(async () => {
		const resp = await fetch('/auth/login', {
			method: 'POST',
			body: JSON.stringify({
				code: new URLSearchParams(location.search).get('code'),
				state: new URLSearchParams(location.search).get('state'),
			}),
		});
		if (resp.status === 204) {
			setActivated(true);
		} else {
			alert('Login failed');
		}
	}, [setActivated]);
	useEffect(() => {
		if (!activated && location.pathname === '/redirect') {
			login();
		} else {
			fetch('/auth/user-data')
				.then((resp) => resp.json())
				.then(console.log);
		}
	}, [activated]);
	return (
		<div>
			<a
				href={`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
					location.origin + '/redirect'
				)}&scope=${scopes.map(encodeURIComponent).join()}&state=${1}`}
			>
				Log in
			</a>
		</div>
	);
}

export default App;
