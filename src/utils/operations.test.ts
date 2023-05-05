/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * @jest-environment jsdom
 */

import { createSession, getUserData, deleteSession, getCsrfToken } from './operations';
import { callWorker } from './postMessage';

import { deleteState } from './storage';
import { deletePkce } from '../shared/pkce';

// Mock the callWorker function
jest.mock('./postMessage', () => ({
	callWorker: jest.fn(),
}));

jest.mock('./storage', () => ({
	deleteState: jest.fn(),
	getState: jest.fn().mockReturnValue('someState'),
}));

jest.mock('../shared/pkce', () => ({
	deletePkce: jest.fn(),
	getPkceVerifier: jest.fn().mockReturnValue('somePkce'),
}));

describe('operatinos', () => {
	afterEach(() => {
		// Reset the mock implementation of callWorker after each test
		jest.resetAllMocks();
	});

	describe('createSession', () => {
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

	describe('getCsrfToken', () => {
		it('should call callWorker with the correct arguments', async () => {
			await getCsrfToken();
			expect(callWorker).toHaveBeenCalledWith('getCsrfToken', []);
		});

		it('should return the response from callWorker', async () => {
			const mockResponse = { success: true };
			(callWorker as jest.Mock).mockResolvedValueOnce(mockResponse);
			const result = await getCsrfToken();
			expect(result).toBe(mockResponse);
		});
	});
});
