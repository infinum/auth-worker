import { getCsrfToken } from './csrf';
import { createSession, getUserData, deleteSession } from './operations';
import { log } from './utils';

const operations = {
	getCsrfToken,
	createSession,
	getUserData,
	deleteSession,
} as const;

export function messageListener(event: ExtendableMessageEvent): void {
	log('message', event.data.type, event.data.fnName);
	if (event.data.type === 'call') {
		if (event.data.fnName in operations) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const fn = operations[event.data.fnName as keyof typeof operations] as any;
			fn(...event.data.options).then(
				(result: unknown) => {
					event.source?.postMessage({ key: event.data.caller, result });
				},
				(error: Error) => {
					event.source?.postMessage({ key: event.data.caller, error: error.message });
				}
			);
		}
	}
}
