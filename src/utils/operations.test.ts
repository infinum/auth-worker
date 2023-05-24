/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * @jest-environment jsdom
 */

import { createSession, getUserData, deleteSession } from './operations';
import { callWorker } from './postMessage';

import { deleteState, getState } from './storage';
import { deletePkce, getPkceVerifier } from '../shared/pkce';

jest.mock('./postMessage');
jest.mock('./storage');
jest.mock('../shared/pkce');

describe('utils/operations', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createSession', () => {
		beforeEach(() => {
			(getState as jest.Mock).mockReturnValueOnce('someState');
			(getPkceVerifier as jest.Mock).mockReturnValueOnce('somePkce');
		});

		afterEach(() => {
			jest.resetAllMocks();
		});

		it('should call callWorker with the correct arguments', async () => {
			globalThis.window = {
				// @ts-ignore
				location: new URL('http://example.com?query#hash'),
			};
			await createSession('provider');
			expect(callWorker).toHaveBeenCalledWith('createSession', [
				'query',
				'provider',
				'someState',
				'http://example.com',
				'somePkce',
			]);
			expect(deleteState).toHaveBeenCalled();
			expect(deletePkce).toHaveBeenCalled();
		});

		it('should call callWorker with hash value if long enough', async () => {
			globalThis.window = {
				// @ts-ignore
				location: new URL('http://example.com?query#hash123456789'),
			};
			await createSession('provider');
			expect(callWorker).toHaveBeenCalledWith('createSession', [
				'hash123456789',
				'provider',
				'someState',
				'http://example.com',
				'somePkce',
			]);
			expect(deleteState).toHaveBeenCalled();
			expect(deletePkce).toHaveBeenCalled();
		});

		it('should return the response from callWorker', async () => {
			const mockResponse = { success: true };
			(callWorker as jest.Mock).mockResolvedValueOnce(mockResponse);
			const result = await createSession('provider');
			expect(result).toBe(mockResponse);
		});
	});

	describe('getUserData', () => {
		it('should call callWorker with the correct arguments', async () => {
			await getUserData();
			expect(callWorker).toHaveBeenCalledWith('getUserData', []);
		});

		it('should return the response from callWorker', async () => {
			const mockResponse = { success: true };
			(callWorker as jest.Mock).mockResolvedValueOnce(mockResponse);
			const result = await getUserData();
			expect(result).toBe(mockResponse);
		});
	});

	describe('deleteSession', () => {
		it('should call callWorker with the correct arguments', async () => {
			await deleteSession();
			expect(callWorker).toHaveBeenCalledWith('deleteSession', []);
		});

		it('should return the response from callWorker', async () => {
			const mockResponse = { success: true };
			(callWorker as jest.Mock).mockResolvedValueOnce(mockResponse);
			const result = await deleteSession();
			expect(result).toBe(mockResponse);
		});
	});
});
