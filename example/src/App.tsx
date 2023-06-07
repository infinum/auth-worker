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
	const [links, setLinks] = useState<Record<string, string>>({});
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
			const res = await fetchFn(userInfoUrl, {
				headers: {
					'X-Use-Auth': 'true',
				},
			});
			const userInfo = await res.json();
			console.log(userInfo);
		}
	}, [result]);

	useEffect(() => {
		if (!result) {
			Promise.all([
				getLoginUrl(OAUTH2_CONFIG, 'google'),
				getLoginUrl(OAUTH2_CONFIG, 'facebook'),
				getLoginUrl(OAUTH2_CONFIG, 'twitter'),
				getLoginUrl(OAUTH2_CONFIG, 'reddit'),
				getLoginUrl(OAUTH2_CONFIG, 'auth0'),
			]).then((urls) => {
				setLinks({
					google: urls[0],
					facebook: urls[1],
					twitter: urls[2],
					reddit: urls[3],
					auth0: urls[4],
				});
			});
		}
	}, []);

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
					{links.google && <a href={links.google}>Log in with Google</a>}
					<br />
					{links.facebook && <a href={links.facebook}>Log in with Facebook</a>}
					<br />
					{links.twitter && <a href={links.twitter}>Log in with Twitter</a>}
					<br />
					{links.reddit && <a href={links.reddit}>Log in with Reddit</a>}
					<br />
					{links.auth0 && <a href={links.auth0}>Log in with Auth0</a>}
				</div>
			)}
		</div>
	);
}

export default App;
