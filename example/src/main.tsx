import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { loadAuthWorker } from 'auth-worker';
import { CLIENT_ID } from './consts';

loadAuthWorker(
	{
		clientId: CLIENT_ID,
		tokenUrl: 'https://authorization-server.com/token',
		filter: {},
		urlPrefix: '/auth',
	},
	'/service-worker.global.js'
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
