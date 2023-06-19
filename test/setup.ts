/**
 * @jest-environment jsdom
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { Crypto } from '@peculiar/webcrypto';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.TextDecoder = TextDecoder;
global.indexedDB = new IDBFactory();
Object.defineProperty(global, 'crypto', {
	value: new Crypto(),
});
