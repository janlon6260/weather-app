const { rules } = require("eslint-config-prettier");

module.exports = {
	root: true,
	extends: ['eslint:recommended', 'plugin:svelte/recommended', 'prettier'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	rules: {
		"require-jsdoc" : 0,
		"svelte/valid-compile": ["error", { "ignoreWarnings": true }]
	}
};
