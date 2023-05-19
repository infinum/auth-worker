/**
 * @jest-environment jsdom
 */

import { MockResponse } from '../../test/mock/Response';
import { getCsrfToken } from './csrf';
import { createSession, fetch } from './operations';
import { messageListener, messageListenerWithOrigin } from './postMesage';

function sleep() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

jest.mock('./state', () => ({
	getState: jest.fn(() => Promise.resolve({})),
	saveState: jest.fn(),
}));

jest.mock('./csrf', () => ({
	getCsrfToken: jest.fn(() => Promise.resolve('csrf')),
}));
jest.mock('./operations', () => ({
	createSession: jest.fn().mockRejectedValue(new Error('createSession')),
	fetch: jest.fn().mockResolvedValue(new MockResponse('foobar', { status: 200, statusText: 'OK', headers: {} })),
}));

describe('worker/postMessage', () => {
	describe('messageListener', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		beforeEach(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			globalThis.Response = MockResponse;
		});

		it('should work for the default case', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			messageListener({
				data: {
					type: 'call',
					fnName: 'fetch',
					options,
					caller: 'test',
				},
				source: { postMessage },
				origin: location.origin,
			} as unknown as ExtendableMessageEvent);

			await sleep();
			expect(fetch).toHaveBeenCalledWith(...options);
			expect(postMessage).toHaveBeenCalledWith(
				{
					key: 'test',
					response: {
						data: 'foobar',
						headers: [],
						status: 200,
						statusText: 'OK',
					},
				},
				{ transfer: ['foobar'] }
			);
		});

		it('should work for Response objects', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			messageListener({
				data: {
					type: 'call',
					fnName: 'getCsrfToken',
					options,
					caller: 'test',
				},
				source: { postMessage },
				origin: location.origin,
			} as unknown as ExtendableMessageEvent);

			await sleep();
			expect(getCsrfToken).toHaveBeenCalledWith(...options);
			expect(postMessage).toHaveBeenCalledWith({ key: 'test', result: 'csrf' });
		});

		it('should handle errors', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			messageListenerWithOrigin({
				data: {
					type: 'call',
					fnName: 'createSession',
					options,
					caller: 'test',
				},
				source: { postMessage },
				origin: location.origin,
			} as unknown as ExtendableMessageEvent);

			await sleep();
			expect(createSession).toHaveBeenCalledWith(...options);
			expect(postMessage).toHaveBeenCalledWith({ key: 'test', error: 'createSession' });
		});

		it("should ignore if the origin doesn't match", async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			messageListenerWithOrigin({
				data: {
					type: 'call',
					fnName: 'createSession',
					options,
					caller: 'test',
				},
				source: { postMessage },
				origin: 'foobar',
			} as unknown as ExtendableMessageEvent);

			await sleep();
			expect(createSession).not.toHaveBeenCalled();
			expect(postMessage).not.toHaveBeenCalled();
		});

		it('should do nothing if the type is not "call"', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			messageListener({
				data: {
					type: 'not-call',
					fnName: 'createSession',
					options,
					caller: 'test',
				},
				source: { postMessage },
				origin: location.origin,
			} as unknown as ExtendableMessageEvent);

			await sleep();
			expect(createSession).not.toHaveBeenCalled();
			expect(postMessage).not.toHaveBeenCalled();
		});

		it('should do nothing if the fnName is not in operations', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			messageListener({
				data: {
					type: 'call',
					fnName: 'not-in-operations',
					options,
					caller: 'test',
				},
				source: { postMessage },
				origin: location.origin,
			} as unknown as ExtendableMessageEvent);

			await sleep();
			expect(postMessage).not.toHaveBeenCalled();
		});
	});
});
