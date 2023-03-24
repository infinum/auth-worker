import { getLoginUrl, createSession, getUserData, deleteSession } from 'auth-worker';
import { useEffect, useState } from 'react';
import './App.css';
import { OAUTH2_CONFIG } from './config';

function App() {
	const [result, setResult] = useState<null | { name: string; picture: string }>(null);
	useEffect(() => {
		console.log('effect', location.pathname);
		if (result) {
			return;
		}
		if (location.pathname.startsWith('/redirect/')) {
			const provider = location.pathname.split('/')[2];
			if (Object.keys(OAUTH2_CONFIG.providers).includes(provider)) {
				createSession(provider).then(
					(userInfo) => {
						setResult(userInfo as unknown as { name: string; picture: string });
						window.location.replace('/');
					},
					(err) => console.error(err)
				);
			} else {
				console.error('Unknown provider', provider);
			}
		} else {
			getUserData().then(setResult as any, () => null);
		}
	});

	const logout = async () => {
		await deleteSession();
		setResult(null);
	};

	return (
		<div>
			{result ? (
				<div>
					<h1>Logged in as {result.name}</h1>
					<img src={result.picture} alt="Profile" />
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
				</div>
			)}
		</div>
	);
}

export default App;
