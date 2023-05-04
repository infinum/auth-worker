export class LocalStorageMock {
	private store: Record<string, string> = {};

	public clear() {
		this.store = {};
	}

	public getItem(key: string) {
		return this.store[key] || null;
	}

	public setItem(key: string, value: string) {
		this.store[key] = String(value);
	}

	public removeItem(key: string) {
		delete this.store[key];
	}

	public get length() {
		return Object.keys(this.store).length;
	}

	public key(index: number) {
		return Object.keys(this.store)[index];
	}
}
