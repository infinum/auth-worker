import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { loadAuthServiceWorker, loadAuthWebWorker } from 'auth-worker';
import { OAUTH2_CONFIG } from './config';

const useSW = localStorage.getItem('useSW') === 'true';

if (useSW) {
	await loadAuthServiceWorker(OAUTH2_CONFIG.config, {
		workerPath: '/service-worker.global.js',
		debug: true,
	}).catch(console.error);
} else {
	await loadAuthWebWorker(OAUTH2_CONFIG.config, {
		workerPath: '/web-worker.global.js',
		debug: true,
	});
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
