import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		exclude: ['auth-worker'],
	},
});
