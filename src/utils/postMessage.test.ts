import { callWorker, setWorker } from './postMessage';

type TListenerFn = (...args: Array<unknown>) => void;

class MockWorker {}

describe('utils/postMessage', () => {
	describe('callWorker', () => {
		const mockReturnValue = 'Mock return value';
		let isError = false;
		let delay = 100;
		const navigator: {
			serviceWorker?: {
				controller: Pick<
					NonNullable<Navigator['serviceWorker']['controller']>,
					'postMessage' | 'addEventListener' | 'removeEventListener'
				>;
			};
		} = {};
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		globalThis.navigator = navigator;

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete globalThis.location;
		globalThis.location = {
			origin: 'https://example.com',
		} as unknown as Location;
		globalThis.Worker = MockWorker as unknown as typeof Worker;
		const listeners: Array<TListenerFn> = [];

		beforeEach(() => {
			navigator.serviceWorker = {
				controller: {
					postMessage: jest.fn((message) => {
						listeners.forEach((listener) =>
							listener({
								data: {
									key: 'somethingElse',
									error: 'Other messages should be ignorred',
								},
								origin: location.origin,
							})
						);
						setTimeout(() => {
							listeners.forEach((listener) =>
								listener({
									data: {
										key: message.caller,
										result: isError ? undefined : mockReturnValue,
										error: isError ? 'Mock error' : undefined,
									},
									origin: location.origin,
								})
							);
						}, delay);
					}),
					addEventListener: jest.fn((_type: string, listener: TListenerFn) => listeners.push(listener)),
					removeEventListener: jest.fn((_type: string, listener: TListenerFn) =>
						listeners.splice(listeners.indexOf(listener), 1)
					),
				},
			};

			setWorker(navigator.serviceWorker.controller as unknown as ServiceWorker);
		});

		afterEach(() => {
			// Clean up the mock Service Worker
			navigator.serviceWorker = undefined;
			listeners.length = 0;
			isError = false;
			delay = 100;
		});

		it('should resolve with the expected value', async () => {
			const result = await callWorker('myFunction', [1, 2, 3]);
			expect(result).toBe(mockReturnValue);
			expect(navigator.serviceWorker?.controller.removeEventListener).toHaveBeenCalled();
			expect(navigator.serviceWorker?.controller.postMessage).toHaveBeenCalledWith({
				type: 'call',
				fnName: 'myFunction',
				options: [1, 2, 3],
				caller: expect.any(String),
			});
		});

		it('should reject with an error if the message contains an error', async () => {
			isError = true;
			await expect(callWorker('myFunction', [1, 2, 3])).rejects.toThrow('Mock error');
			expect(navigator.serviceWorker?.controller.removeEventListener).toHaveBeenCalled();
		});

		it('should reject with an error if the timeout is exceeded', async () => {
			delay = 50000;
			jest.useFakeTimers();
			const result = expect(callWorker('myFunction', [1, 2, 3])).rejects.toThrow('Timeout');
			jest.runAllTimers();
			await result;
			expect(navigator.serviceWorker?.controller.removeEventListener).toHaveBeenCalled();
		});
	});
});
