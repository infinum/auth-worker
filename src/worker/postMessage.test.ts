import { getCsrfToken } from './csrf';
import { createSession } from './operations';
import { messageListener } from './postMesage';

jest.mock('./csrf', () => ({
	getCsrfToken: jest.fn(() => 'csrf'),
}));
jest.mock('./operations', () => ({
	createSession: jest.fn().mockRejectedValue(new Error('createSession')),
}));

describe('worker/postMessage', () => {
	describe('messageListener', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should work for the default case', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			await messageListener({
				data: {
					type: 'call',
					fnName: 'getCsrfToken',
					options,
					caller: 'test',
				},
				source: { postMessage },
			} as unknown as ExtendableMessageEvent);

			expect(getCsrfToken).toHaveBeenCalledWith(...options);
			expect(postMessage).toHaveBeenCalledWith({ key: 'test', result: 'csrf' });
		});

		it('should handle errors', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			await messageListener({
				data: {
					type: 'call',
					fnName: 'createSession',
					options,
					caller: 'test',
				},
				source: { postMessage },
			} as unknown as ExtendableMessageEvent);

			expect(createSession).toHaveBeenCalledWith(...options);
			expect(postMessage).toHaveBeenCalledWith({ key: 'test', error: 'createSession' });
		});

		it('should do nothing if the type is not "call"', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			await messageListener({
				data: {
					type: 'not-call',
					fnName: 'createSession',
					options,
					caller: 'test',
				},
				source: { postMessage },
			} as unknown as ExtendableMessageEvent);

			expect(createSession).not.toHaveBeenCalled();
			expect(postMessage).not.toHaveBeenCalled();
		});

		it('should do nothing if the fnName is not in operations', async () => {
			const postMessage = jest.fn();
			const options = [1, 2, 3];
			await messageListener({
				data: {
					type: 'call',
					fnName: 'not-in-operations',
					options,
					caller: 'test',
				},
				source: { postMessage },
			} as unknown as ExtendableMessageEvent);

			expect(postMessage).not.toHaveBeenCalled();
		});
	});
});
