export function getHashParams(): Record<string, string> {
	const fragmentString = location.hash.substring(1);

	// Parse query string to see if page request is coming from OAuth 2.0 server.
	const params: Record<string, string> = {};
	const regex = /([^&=]+)=([^&]*)/g;
	let m;
	while ((m = regex.exec(fragmentString))) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, name, value] = m;
		params[name] = decodeURIComponent(value);
	}

	return params;
}
