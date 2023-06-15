/**
 * @jest-environment jsdom
 */

import { IProvider } from '../interfaces/IProvider';
import { GrantFlow } from '../shared/enums';
import { initAuthServiceWorker } from './service-worker';
import { getAuthState } from './state';

jest.mock('./state', () => ({
	getState: jest.fn(),
	saveState: jest.fn(),
}));

describe('worker/service-worker', () => {
	describe('initAuthServiceWorker', () => {
		beforeEach(() => {
			jest.spyOn(globalThis, 'addEventListener');
			jest.spyOn(globalThis, 'removeEventListener');

			(getAuthState as jest.Mock).mockResolvedValue({});
		});

		afterEach(() => {
			jest.resetAllMocks();
		});

		it('should work with a custom config param', async () => {
			const providers: Record<string, IProvider> = {
				exampleProvider: {
					grantType: GrantFlow.Token,
				},
			};

			const cleanupFn = await initAuthServiceWorker(providers, '/auth', [], undefined, 'config={"test": 1}');

			expect(cleanupFn).toBeInstanceOf(Function);
			expect(globalThis.addEventListener).toHaveBeenCalledWith('install', expect.any(Function));
			expect(globalThis.addEventListener).toHaveBeenCalledWith('activate', expect.any(Function));
			expect(globalThis.addEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
			expect(globalThis.removeEventListener).not.toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.removeEventListener).not.toHaveBeenCalledWith('message', expect.any(Function));

			cleanupFn();
			expect(globalThis.removeEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));

			const state = await getAuthState();

			expect(state.config).toEqual({
				config: {
					test: 1,
				},
				debug: false,
				providers,
			});
		});

		it('should work with URL params', async () => {
			const providers: Record<string, IProvider> = {
				exampleProvider: {
					grantType: GrantFlow.Token,
				},
			};

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete globalThis.location;
			globalThis.location = { search: '?config={"test": 2}' } as Location;

			const cleanupFn = await initAuthServiceWorker(providers);

			expect(cleanupFn).toBeInstanceOf(Function);
			expect(globalThis.addEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
			expect(globalThis.removeEventListener).not.toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.removeEventListener).not.toHaveBeenCalledWith('message', expect.any(Function));

			cleanupFn();
			expect(globalThis.removeEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));

			const state = await getAuthState();

			expect(state.config).toEqual({
				config: {
					test: 2,
				},
				debug: false,
				providers,
			});
		});

		it('should work without URL params', async () => {
			const providers: Record<string, IProvider> = {
				exampleProvider: {
					grantType: GrantFlow.Token,
				},
			};

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete globalThis.location;
			globalThis.location = { search: '' } as Location;

			const cleanupFn = await initAuthServiceWorker(providers);

			expect(cleanupFn).toBeInstanceOf(Function);
			expect(globalThis.addEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
			expect(globalThis.removeEventListener).not.toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.removeEventListener).not.toHaveBeenCalledWith('message', expect.any(Function));

			cleanupFn();
			expect(globalThis.removeEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));

			const state = await getAuthState();

			expect(state.config).toEqual({
				config: {},
				debug: false,
				providers,
			});
		});

		it('should claim control', async () => {
			const providers: Record<string, IProvider> = {
				exampleProvider: {
					grantType: GrantFlow.Token,
				},
			};

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete globalThis.location;
			globalThis.location = { search: '?config={"test": 2}' } as Location;

			await initAuthServiceWorker(providers, '/auth', [], undefined, 'config={"test": 1}');

			const installFn = (globalThis.addEventListener as jest.Mock).mock.calls[0][1];
			const activateFn = (globalThis.addEventListener as jest.Mock).mock.calls[1][1];

			const skipWaiting = jest.fn();
			const claim = jest.fn();
			const matchAll = jest.fn(() => Promise.resolve([{ postMessage: jest.fn() }]));

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			globalThis.clients = {
				claim,
				matchAll,
			} as unknown as Clients;

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			globalThis.skipWaiting = skipWaiting;

			await installFn({ waitUntil: jest.fn() } as unknown as ExtendableEvent);

			expect(skipWaiting).toHaveBeenCalled();

			await activateFn({ waitUntil: jest.fn() } as unknown as ExtendableEvent);

			expect(skipWaiting).toHaveBeenCalled();
			expect(claim).toHaveBeenCalled();
			expect(matchAll).toHaveBeenCalled();

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			expect(globalThis.clients.matchAll).toHaveBeenCalled();
		});
	});
});
