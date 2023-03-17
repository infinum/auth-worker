import { getLoginUrl, createSession, getUserData, deleteSession } from 'auth-worker';
import { useEffect, useState } from 'react';
import './App.css';
import { OAUTH2_CONFIG } from './config';

function App() {
	const [result, setResult] = useState<null | { name: string; picture: string }>(null);
	useEffect(() => {
		console.log('effect', location.pathname);
		if (location.pathname === '/redirect') {
			createSession('google').then(
				(userInfo) => {
					setResult(userInfo as unknown as { name: string; picture: string });
					window.location.replace('/');
				},
				(err) => console.error(err)
			);
		} else if (!result) {
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
					<button onClick={logout}>Logut</button>
				</div>
			) : (
				<a href={getLoginUrl(OAUTH2_CONFIG, 'google')}>Log in</a>
			)}
		</div>
	);
}

export default App;
