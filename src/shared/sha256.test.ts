import { sha256 } from './sha256';

describe('sha256', () => {
	it('should work for an empty string', () => {
		const result = sha256('');
		expect(result.join()).toEqual(
			'227,176,196,66,152,252,28,20,154,251,244,200,153,111,185,36,39,174,65,228,100,155,147,76,164,149,153,27,120,82,184,85'
		);
	});

	it('should work for a string', () => {
		const result = sha256('test');
		expect(result.join()).toEqual(
			'159,134,208,129,136,76,125,101,154,47,234,160,197,90,208,21,163,191,79,27,43,11,130,44,209,93,108,21,176,240,10,8'
		);
	});
});
