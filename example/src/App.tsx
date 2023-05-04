import { getLoginUrl, createSession, getUserData, deleteSession } from 'auth-worker';
import { useEffect, useState } from 'react';
import './App.css';
import { OAUTH2_CONFIG } from './config';

function App() {
	const [result, setResult] = useState<null | { data: { name: string; picture: string } }>(null);
	useEffect(() => {
		if (result) {
			return;
		}
		console.log('effect', location.pathname, result);
		if (location.pathname.startsWith('/redirect/')) {
			const provider = location.pathname.split('/')[2];
			if (Object.keys(OAUTH2_CONFIG.providers).includes(provider)) {
				createSession(provider).then(
					(userInfo) => {
						setResult(userInfo as unknown as { data: { name: string; picture: string } });
						window.history.replaceState({}, '', '/');
					},
					(err) => console.error(err)
				);
			} else {
				console.error('Unknown provider', provider);
			}
		} else {
			getUserData().then(setResult as any, () => null);
		}
	}, []);

	const logout = async () => {
		await deleteSession();
		setResult(null);
	};

	return (
		<div>
			{result ? (
				<div>
					<h1>Logged in as {result.data.name}</h1>
					<img src={result.data?.picture} alt="Profile" />
					<code>{JSON.stringify(result)}</code>
					<button onClick={logout}>Logout</button>
				</div>
			) : (
				<div>
					<a href={getLoginUrl(OAUTH2_CONFIG, 'google')}>Log in with Google</a>
					<br />
					<a href={getLoginUrl(OAUTH2_CONFIG, 'facebook')}>Log in with Facebook</a>
					<br />
					<a href={getLoginUrl(OAUTH2_CONFIG, 'twitter')}>Log in with Twitter</a>
					<br />
					<a href={getLoginUrl(OAUTH2_CONFIG, 'reddit')}>Log in with Reddit</a>
					<br />
					<a href={getLoginUrl(OAUTH2_CONFIG, 'auth0')}>Log in with Auth0</a>
				</div>
			)}
		</div>
	);
}

export default App;
