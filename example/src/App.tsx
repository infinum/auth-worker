import { getLoginUrl, createSession, getUserData } from 'auth-worker';
import { useEffect, useState } from 'react';
import './App.css';
import { OAUTH2_CONFIG } from './config';

function App() {
	const [activated, setActivated] = useState(false);
	useEffect(() => {
		if (!activated && location.pathname === '/redirect') {
			createSession('google').then(
				(userInfo) => {
					console.log(userInfo);
					setActivated(true);
				},
				(err) => console.error(err)
			);
		} else if (localStorage.getItem('activated') === 'true') {
			getUserData().then(console.log);
		}
	}, [activated]);
	return (
		<div>
			<a href={getLoginUrl(OAUTH2_CONFIG, 'google')}>Log in</a>
		</div>
	);
}

export default App;
