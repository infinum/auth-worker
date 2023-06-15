import { getLoginUrl, getUserData, deleteSession } from 'auth-worker';
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
		getUserData().then(setResult as any, () => null);
	}, []);

	const logout = async () => {
		await deleteSession();
		setResult(null);
	};

	const getUserInfo = useCallback(async () => {
		// @ts-ignore
		const userInfoUrl: string | undefined = providerUrls[result?.provider];
		if (userInfoUrl) {
			await fetch('/test');
			const res = await fetch(userInfoUrl, {
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
					{/* <button onClick={logout}>Logout</button> */}
					<a href="/auth/logout">Logout</a>
				</div>
			) : (
				<div>
					<a href="/auth/login/google">Log in with Google</a>
					{/* {links.google && <a href={links.google}>Log in with Google</a>} */}
					<br />
					<a href="/auth/login/facebook">Log in with Facebook</a>
					{/* {links.facebook && <a href={links.facebook}>Log in with Facebook</a>} */}
					<br />
					<a href="/auth/login/twitter">Log in with Twitter</a>
					{/* {links.twitter && <a href={links.twitter}>Log in with Twitter</a>} */}
					<br />
					<a href="/auth/login/reddit">Log in with Reddit</a>
					{/* {links.reddit && <a href={links.reddit}>Log in with Reddit</a>} */}
					<br />
					<a href="/auth/login/auth0">Log in with Auth0</a>
					{/* {links.auth0 && <a href={links.auth0}>Log in with Auth0</a>} */}
				</div>
			)}
		</div>
	);
}

export default App;
