type IListener = (data: unknown) => void;

export class Worker {
	public static listeners: Record<string, Array<IListener>> = {};

	public addEventListener(event: string, listener: IListener) {
		if (!Worker.listeners[event]) {
			Worker.listeners[event] = [];
		}

		Worker.listeners[event].push(listener);
	}

	public removeEventListener(event: string, listener: IListener) {
		if (!Worker.listeners[event]) {
			return;
		}

		Worker.listeners[event] = Worker.listeners[event].filter((l) => l !== listener);
	}
}
