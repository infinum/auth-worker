import { auth0, facebook, google, reddit, twitter } from './presets';

describe('shared/presets', () => {
	describe('userInfoParser', () => {
		it('should work for google', () => {
			const data = {
				sub: '123',
				name: 'test',
				email: 'test@google.com',
				picture: 'https://google.com',
			};

			const result = google?.userInfoParser?.(data);
			expect(result).toEqual({
				id: '123',
				name: 'test',
				email: 'test@google.com',
				picture: 'https://google.com',
			});
		});

		it('should work for facebook', () => {
			const data = {
				id: '123',
				name: 'test',
				email: 'test@facebook.com',
				profile_pic: 'https://facebook.com',
			};

			const result = facebook?.userInfoParser?.(data);
			expect(result).toEqual({
				id: '123',
				name: 'test',
				email: 'test@facebook.com',
				picture: 'https://facebook.com',
			});
		});

		it('should work for twitter', () => {
			const data = {
				id: '123',
				name: 'test',
				email: 'test@twitter.com',
				profile_image_url_https: 'https://twitter.com',
			};

			const result = twitter?.userInfoParser?.(data);
			expect(result).toEqual({
				id: '123',
				name: 'test',
				email: 'test@twitter.com',
				picture: 'https://twitter.com',
			});
		});

		it('should work for reddit', () => {
			const data = {
				id: '123',
				name: 'test',
				email: 'test@reddit.com',
				icon_img: 'https://reddit.com?test=1\\&amp;test=2',
			};

			const result = reddit?.userInfoParser?.(data);
			expect(result).toEqual({
				id: '123',
				name: 'test',
				email: 'test@reddit.com',
				picture: 'https://reddit.com?test=1&test=2',
			});
		});

		it('should work for reddit with no image', () => {
			const data = {
				id: '123',
				name: 'test',
				email: 'test@reddit.com',
			};

			const result = reddit?.userInfoParser?.(data);
			expect(result).toEqual({
				id: '123',
				name: 'test',
				email: 'test@reddit.com',
			});
		});

		it('should work for auth0', () => {
			const data = {
				sub: '123',
				name: 'test',
				email: 'test@auth0.com',
				picture: 'https://auth0.com',
			};

			const result = auth0?.('foobar')?.userInfoParser?.(data);
			expect(result).toEqual({
				id: '123',
				name: 'test',
				email: 'test@auth0.com',
				picture: 'https://auth0.com',
			});
		});
	});
});
