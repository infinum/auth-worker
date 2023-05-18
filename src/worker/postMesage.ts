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

export function messageListenerWithOrigin(event: ExtendableMessageEvent | MessageEvent): void {
	if (event.origin !== location.origin) return;
	return messageListener(event);
}

export function messageListener(event: ExtendableMessageEvent | MessageEvent): void {
	log('message', event.data.type, event.data.fnName, event.data).catch(() => null);
	if (event.data.type === 'call') {
		if (event.data.fnName in operations) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const fn = operations[event.data.fnName as keyof typeof operations] as any;
			const target = event.source ?? globalThis;
			fn(...event.data.options).then(
				(result: unknown) => {
					if (result instanceof Response) {
						result.text().then((text) => {
							target.postMessage({
								key: event.data.caller,
								response: {
									text,
									status: result.status,
									statusText: result.statusText,
									headers: Array.from(result.headers.entries()),
								},
							});
						});
						return;
					}
					target.postMessage({ key: event.data.caller, result });
				},
				(error: Error) => {
					target.postMessage({ key: event.data.caller, error: error.message });
				}
			);
		}
	}
}
