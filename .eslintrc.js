module.exports = {
	env: {
		node: true,
		es6: true
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: '2019'
	},
	plugins: ['prettier'],
	extends: ['google', 'eslint:recommended'],
	rules: {
		'prettier/prettier': 'error'
	}
};
