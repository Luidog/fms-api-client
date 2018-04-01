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
const environment = require('dotenv');
const varium = require('varium');

environment.config({ path: './tests/.env' });

varium(process.env, './tests/env.manifest');

/**
 * Connect must be called before the filemaker class is instiantiated. This connect uses Marpat. Marpat is a fork of
 * Camo. much love to https://github.com/scottwrobinson for his creation and maintenance of Camo.
 * My fork of Camo - Marpat is designed to allow the use of multiple datastores with the focus on encrypted storage.
 * @param  {String} url
 * @return {Promise}           A database.
 */
connect('nedb://memory').then(db => {
  /**
   * The client is the FileMaker class. The class then offers methods designed to
   * make it easier to integrate into filemaker
   */
  const client = Filemaker.create({
    application: process.env.APPLICATION,
    server: process.env.SERVER,
    _username: process.env.USERNAME,
    _password: process.env.PASSWORD,
    _layout: process.env.LAYOUT
  });

  client
    .save()
    .then(filemaker => {
      filemaker
        .list('Heroes', { range: 1 })
        .then(response => filemaker.fieldData(response.data))
        .then(response => console.log('A Long Time Ago', response))
        .catch(error => console.log('That is no moon...', error));

      filemaker
        .create('Heroes', { name: 'Anakin Skywalker' })
        .then(response =>
          console.log('Jedi business, go back to your drinks!', response)
        )
        .catch(error => console.log('That is no moon...', error));

      filemaker
        .globals({ ship: 'Millenium Falcon' })
        .then(response =>
          console.log(
            'Made the Kessel Run in less than twelve parsecs.',
            response
          )
        )
        .catch(error => console.log('That is no moon...', error));

      return filemaker;
    })
    .then(filemaker => {
      filemaker
        .find('Heroes', [{ name: 'Anakin Skywalker' }], { range: '1' })
        .then(response => filemaker.recordId(response.data))
        .then(recordIds =>
          filemaker.edit('Heroes', recordIds[0], { name: 'Darth Vader' })
        )
        .then(response =>
          console.log('I find your lack of faith disturbing', response)
        )
        .catch(error => console.log('That is no moon...', error));
      return filemaker;
    })
    .then(filemaker => {
      filemaker
        .find('Heroes', [{ name: 'Anakin Skywalker' }], { range: '1' })
        .then(response => filemaker.recordId(response.data[0]))
        .then(response => {
          console.log(response);
          return response;
        })
        .then(recordId => filemaker.delete('Heroes', recordId))
        .then(response => console.log('Fin.', response))
        .catch(error => console.log('That is no moon...', error));
    });
});

```

## Tests

```sh
npm install
npm test
```
```

> fms-api-client@0.0.2 test /Users/luidelaparra/Documents/Development/fms-api-client
> mocha --recursive ./tests
  FileMaker Data API Client
    ✓ should allow an instance to be saved.
    ✓ should get an authentication token. (193ms)
    ✓ should create FileMaker records. (162ms)
    ✓ should edit FileMaker records.
    ✓ should delete FileMaker records.
    ✓ should get a FileMaker specific record.
    ✓ should allow you to modify the FileMaker List response (175ms)
    ✓ should allow you to find FileMaker records (160ms)
    ✓ should allow you to set FileMaker globals (157ms)
  9 passing (885ms)

```

## Dependencies

- [lodash](https://ghub.io/lodash): Lodash modular utilities.
- [marpat](https://ghub.io/marpat): A class-based ES6 ODM for Mongo-like databases.
- [moment](https://ghub.io/moment): Parse, validate, manipulate, and display dates
- [request](https://ghub.io/request): Simplified HTTP request client.
- [request-promise](https://ghub.io/request-promise): The simplified HTTP request client &#39;request&#39; with Promise support. Powered by Bluebird.

## Dev Dependencies

- [chai](https://ghub.io/chai): BDD/TDD assertion library for node.js and the browser. Test framework agnostic.
- [chai-as-promised](https://ghub.io/chai-as-promised): Extends Chai with assertions about promises.
- [dotenv](https://ghub.io/dotenv): Loads environment variables from .env file
- [eslint](https://ghub.io/eslint): An AST-based pattern checker for JavaScript.
- [eslint-config-google](https://ghub.io/eslint-config-google): ESLint shareable config for the Google style
- [eslint-config-prettier](https://ghub.io/eslint-config-prettier): Turns off all rules that are unnecessary or might conflict with Prettier.
- [eslint-plugin-prettier](https://ghub.io/eslint-plugin-prettier): Runs prettier as an eslint rule
- [jsdocs](https://ghub.io/jsdocs): jsdocs
- [minami](https://ghub.io/minami): Clean and minimal JSDoc 3 Template / Theme
- [mocha](https://ghub.io/mocha): simple, flexible, fun test framework
- [package-json-to-readme](https://ghub.io/package-json-to-readme): Generate a README.md from package.json contents
- [prettier](https://ghub.io/prettier): Prettier is an opinionated code formatter
- [varium](https://ghub.io/varium): A strict parser and validator of environment config variables

## License

MIT
