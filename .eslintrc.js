module.exports = {
	"extends": ["plugin:@infinum/core", "plugin:@infinum/typescript"],
	"parserOptions": {
		"project": ["./tsconfig.json"]
	},
	"parser": "@typescript-eslint/parser"
};