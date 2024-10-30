import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				if (path === '/icons/pwa-512x512.png') {
					// Ignorer 404-feilen for ikonet under prerendering
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;
