# fms-api-client [![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client)

A FileMaker Data API client designed to allow interaction with a FileMaker application from a web environment.

## Installation

This is a [Node.js](https://nodejs.org/) module available through the
[npm registry](https://www.npmjs.com/). It can be installed using the
[`npm`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally)
or
[`yarn`](https://yarnpkg.com/en/)
command line tools.

```sh
npm install fms-api-client --save
```

## Usage

```js
const { connect } = require('marpat');
const { Filemaker } = require('./filemaker');

connect('nedb://data').then(db => {
	const filemaker = Filemaker.create({
		application: 'mock-application',
		server: 'https://mock-server.com',
		_username: 'obi-wan',
		_password: 'kenobi'
	});

	filemaker.save().then(client => console.log(client.toJSON()));
});
```

## Tests

```sh
npm install
npm test
```

```
> fms-api-client@0.0.1 test /fms-api-client
> mocha --recursive ./tests
  FileMaker Data API Node Adapter
    ✓ will eventually have tests
  1 passing (13ms)
```

## Dependencies

*   [lodash](https://ghub.io/lodash): Lodash modular utilities.
*   [marpat](https://ghub.io/marpat): A class-based ES6 ODM for Mongo-like databases.
*   [moment](https://ghub.io/moment): Parse, validate, manipulate, and display dates

## Dev Dependencies

*   [chai](https://ghub.io/chai): BDD/TDD assertion library for node.js and the browser. Test framework agnostic.
*   [eslint](https://ghub.io/eslint): An AST-based pattern checker for JavaScript.
*   [eslint-config-google](https://ghub.io/eslint-config-google): ESLint shareable config for the Google style
*   [eslint-config-prettier](https://ghub.io/eslint-config-prettier): Turns off all rules that are unnecessary or might conflict with Prettier.
*   [eslint-plugin-prettier](https://ghub.io/eslint-plugin-prettier): Runs prettier as an eslint rule
*   [jsdocs](https://ghub.io/jsdocs): jsdocs
*   [mocha](https://ghub.io/mocha): simple, flexible, fun test framework
*   [package-json-to-readme](https://ghub.io/package-json-to-readme): Generate a README.md from package.json contents
*   [prettier](https://ghub.io/prettier): Prettier is an opinionated code formatter

## License

MIT
