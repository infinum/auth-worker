import { getLoginUrl, createSession, getUserData, deleteSession, fetch as workerFetch } from 'auth-worker';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { OAUTH2_CONFIG } from './config';

const providerUrls: Record<string, string> = {
	google: 'https://www.googleapis.com/oauth2/v3/userinfo',
	facebook: 'https://graph.facebook.com/v9.0/me',
	twitter: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
	reddit: 'https://oauth.reddit.com/api/v1/me',
	auth0: 'https://dev-u8csbbr8zashh2k8.us.auth0.com/userinfo',
};

const useSW = localStorage.getItem('useSW') === 'true';

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

	const getUserInfo = useCallback(async () => {
		// @ts-ignore
		const userInfoUrl: string | undefined = providerUrls[result?.provider];
		const fetchFn = useSW ? fetch : workerFetch;
		if (userInfoUrl) {
			await fetchFn('/test');
			const res = await fetchFn(userInfoUrl);
			const userInfo = await res.json();
			console.log(userInfo);
		}
	}, [result]);

	return (
		<div>
			{result ? (
				<div>
					<h1>Logged in as {result.data.name}</h1>
					<img src={result.data?.picture} alt="Profile" />
					<code>{JSON.stringify(result)}</code>
					<button onClick={getUserInfo}>Get user info</button>
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
