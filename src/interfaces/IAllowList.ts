export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'HEAD' | 'DELETE';

export type IAllowList = Array<RegExp | string | { url: RegExp | string; methods: Array<HttpMethod> }>;
