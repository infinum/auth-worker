import { MockResponse } from '../../test/mock/Response';
import { createSession, deleteSession, getUserData } from './operations';
import { messageListener, messageListenerWithOrigin } from './postMesage';

function sleep() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

jest.mock('./operations');

describe('worker/postMessage', () => {
	describe('messageListener', () => {
		beforeEach(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			globalThis.Response = MockResponse;
		});

		afterEach(() => {
			jest.resetAllMocks();
		});

		it('should work for the default case', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			(getUserData as jest.Mock).mockResolvedValueOnce(
				new MockResponse('foobar', { status: 200, statusText: 'OK', headers: {} })
			);

			messageListener({
				data: {
					type: 'call',
					fnName: 'getUserData',
					options,
					caller: 'test',
				},
				source: { postMessage },
				origin: location.origin,
			} as unknown as ExtendableMessageEvent);

			await sleep();
			expect(getUserData).toHaveBeenCalledWith(...options);
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
			(deleteSession as jest.Mock).mockResolvedValueOnce('deleteSession');
			messageListener({
				data: {
					type: 'call',
					fnName: 'deleteSession',
					options,
					caller: 'test',
				},
				source: { postMessage },
				origin: location.origin,
			} as unknown as ExtendableMessageEvent);

			await sleep();
			expect(deleteSession).toHaveBeenCalledWith(...options);
			expect(postMessage).toHaveBeenCalledWith({ key: 'test', result: 'deleteSession' });
		});

		it('should handle errors', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			(createSession as jest.Mock).mockRejectedValueOnce(new Error('createSession'));
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
