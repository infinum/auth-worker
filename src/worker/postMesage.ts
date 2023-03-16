import { getCsrfToken } from './csrf';
import { createSession, getUserData, deleteSession } from './operations';

const operations = {
	getCsrfToken,
	createSession,
	getUserData,
	deleteSession,
} as const;

export function messageListener(event: ExtendableMessageEvent) {
	if (event.data.type === 'call') {
		if (event.data.fnName in operations) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const fn = operations[event.data.fnName as keyof typeof operations] as any;
			const result = fn(...event.data.options);
			event.ports[0].postMessage({ key: event.data.caller, result });
		}
	}
}
