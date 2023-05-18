import { getCsrfToken } from './csrf';
import { createSession, getUserData, deleteSession, fetch } from './operations';
import { log } from './utils';

const operations = {
	getCsrfToken,
	createSession,
	getUserData,
	deleteSession,
	fetch,
} as const;

export function messageListener(event: ExtendableMessageEvent | MessageEvent): void {
	log('raw message:', event.origin, location.origin, event).catch(() => null);
	if (event.origin !== location.origin) return;
	log('message', event.data.type, event.data.fnName).catch(() => null);
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
