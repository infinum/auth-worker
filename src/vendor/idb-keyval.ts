// https://github.com/jakearchibald/idb-keyval/blob/main/src/index.ts

/* eslint-disable @typescript-eslint/ban-ts-comment */
export function promisifyRequest<T = undefined>(request: IDBRequest<T> | IDBTransaction): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		// @ts-ignore - file size hacks
		request.oncomplete = request.onsuccess = () => resolve(request.result);
		// @ts-ignore - file size hacks
		request.onabort = request.onerror = () => {
			console.error(request.error);
			reject(request.error);
		};
	});
}

export function createStore(dbName: string, storeName: string): UseStore {
	const request = indexedDB.open(dbName);
	request.onupgradeneeded = () => request.result.createObjectStore(storeName);
	const dbp = promisifyRequest(request);

	return (txMode, callback) =>
		dbp.then((db) => {
			const transaction = db.transaction(storeName, txMode);
			transaction.onerror = () => {
				console.error(transaction.error);
			};
			const store = transaction.objectStore(storeName);
			return callback(store);
		});
}

const defaultStore = () => createStore('auth-worker-store', 'keyval');

export type UseStore = <T>(
	txMode: IDBTransactionMode,
	callback: (store: IDBObjectStore) => T | PromiseLike<T>
) => Promise<T>;

export function get<T = string>(key: IDBValidKey): Promise<T | undefined> {
	return defaultStore()('readonly', (store) => promisifyRequest(store.get(key)));
}

export function update<T = string>(key: IDBValidKey, updater: (oldValue: T | undefined) => T): Promise<void> {
	return defaultStore()(
		'readwrite',
		(store) =>
			new Promise((resolve, reject) => {
				store.get(key).onsuccess = function () {
					try {
						store.put(updater(this.result), key);
						resolve(promisifyRequest(store.transaction));
					} catch (err) {
						reject(err);
					}
				};
			})
	);
}

export async function set(key: IDBValidKey, value: string): Promise<void> {
	const keysList = await keys();
	if (keysList.includes(key)) {
		return update(key, () => value);
	}
	return defaultStore()('readwrite', (store) => {
		store.put(value, key);
		return promisifyRequest(store.transaction);
	});
}

export function delMany(keys: Array<IDBValidKey>): Promise<void> {
	return defaultStore()('readwrite', (store: IDBObjectStore) => {
		keys.forEach((key: IDBValidKey) => store.delete(key));
		return promisifyRequest(store.transaction);
	});
}

export function keys<KeyType extends IDBValidKey>(): Promise<Array<KeyType>> {
	return defaultStore()('readonly', (store) => {
		return promisifyRequest(store.getAllKeys() as unknown as IDBRequest<Array<KeyType>>);
	});
}
