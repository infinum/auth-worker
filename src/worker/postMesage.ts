import { getCsrfToken } from './csrf';
import { createSession, getUserData, deleteSession } from './operations';
import { log } from './utils';

const operations = {
	getCsrfToken,
	createSession,
	getUserData,
	deleteSession,
} as const;

export async function messageListener(event: ExtendableMessageEvent) {
	log('message', event.data.type, event.data.fnName);
	if (event.data.type === 'call') {
		if (event.data.fnName in operations) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const fn = operations[event.data.fnName as keyof typeof operations] as any;
			try {
				const result = await fn(...event.data.options);
				event.source?.postMessage({ key: event.data.caller, result });
			} catch (error) {
				event.source?.postMessage({ key: event.data.caller, error: (error as Error).message });
			}
		}
	}
}
