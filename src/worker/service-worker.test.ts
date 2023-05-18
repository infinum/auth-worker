/**
 * @jest-environment jsdom
 */

import { IProvider } from '../interfaces/IProvider';
import { GrantFlow } from '../shared/enums';
import { initAuthServiceWorker } from './service-worker';
import { getState } from './state';

jest.mock('./state', () => ({
	getState: jest.fn(),
	saveState: jest.fn(),
}));

describe('worker/service-worker', () => {
	describe('initAuthServiceWorker', () => {
		beforeEach(() => {
			jest.spyOn(globalThis, 'addEventListener');
			jest.spyOn(globalThis, 'removeEventListener');

			(getState as jest.Mock).mockResolvedValue({});
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

			const cleanupFn = await initAuthServiceWorker(providers, undefined, 'config={"test": 1}');

			expect(cleanupFn).toBeInstanceOf(Function);
			expect(globalThis.addEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
			expect(globalThis.removeEventListener).not.toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.removeEventListener).not.toHaveBeenCalledWith('message', expect.any(Function));

			cleanupFn();
			expect(globalThis.removeEventListener).toHaveBeenCalledWith('fetch', expect.any(Function));
			expect(globalThis.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));

			const state = await getState();

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

			const state = await getState();

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

			const state = await getState();

			expect(state.config).toEqual({
				config: {},
				debug: false,
				providers,
			});
		});
	});
});
