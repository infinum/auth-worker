const pack = require('./package.json');
const fs = require('fs');

const package = {
	name: pack.name,
	version: pack.version,
	description: pack.description,
	keywords: pack.keywords,
	author: pack.author,
	license: pack.license,
	repository: pack.repository,
	bugs: pack.bugs,
	homepage: pack.homepage,

	main: pack.main,
	module: pack.module,

	dependencies: pack.dependencies,
};

fs.writeFileSync('./dist/package.json', JSON.stringify(package, null, 2));
