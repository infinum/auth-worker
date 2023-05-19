export class MockResponse {
	private readonly _status: number;
	private readonly _statusText: string = 'OK';
	private readonly _headers: Map<string, string>;

	constructor(
		private readonly data: unknown,
		init: { status: number; headers: Record<string, string>; statusText: string }
	) {
		this._status = init.status;
		this._headers = new Map(Object.entries(init.headers));
		this._statusText = init.statusText;
	}
	public async arrayBuffer(): Promise<unknown> {
		return this.data;
	}
	public get statusText(): string {
		return this._statusText;
	}
	public get headers(): unknown {
		return this._headers;
	}
	public get status(): number {
		return this._status;
	}
}
