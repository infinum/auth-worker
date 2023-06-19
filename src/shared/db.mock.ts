let secret: string | null = null;
const data = new Map<string, string>();

export { SECURE_KEY } from './db';

export function setSecret(secretPhrase: string | undefined) {
	secret = secretPhrase || null;
}

export function isPersistable(): boolean {
	return Boolean(secret);
}

export function setMockData(key: string, value: string) {
	data.set(key, value);
}

export function clearMockData() {
	data.clear();
}

export async function getData(key: string): Promise<string | null> {
	return data.get(key) || null;
}

export async function saveData(key: string, value: string) {
	data.set(key, value);
}

export async function deleteData(keys: Array<string>): Promise<void> {
	keys.forEach((key) => data.delete(key));
}

export async function getKeys(): Promise<Array<string>> {
	return Array.from(data.keys());
}
