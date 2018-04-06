# fms-api-client [![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client)

A FileMaker Data API client designed to allow interaction with a FileMaker application from a web environment.

For in depth documentation: https://luidog.github.io/fms-api-client

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
'use strict';

const environment = require('dotenv');
const varium = require('varium');
const colors = require('colors');
const { connect } = require('marpat');
const { Filemaker } = require('fms-api-client');

environment.config({ path: './tests/.env' });

varium(process.env, './tests/env.manifest');

/**
 * Connect must be called before the filemaker class is instiantiated. This connect uses Marpat. Marpat is a fork of
 * Camo. much love to https://github.com/scottwrobinson for his creation and maintenance of Camo.
 * My fork of Camo - Marpat is designed to allow the use of multiple datastores with the focus on encrypted storage.
 * @param  {url} url a url string representing a datastore.
 * @param  {options} options an object representing datastore options. See Marpat for more info.
 * @return {Promise}           A database.
 */

connect('nedb://data').then(db => {
  /**
   * The client is the FileMaker class. The class then offers methods designed to
   * make it easier to integrate into filemaker's api.
   */

  const client = Filemaker.create({
    application: process.env.APPLICATION,
    server: process.env.SERVER,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    layout: process.env.LAYOUT
  });

  /**
   * A client can be used directly after saving it. It is also stored on the datastore
   * so that it can be reused later.
   */

  client
    .save()
    .then(client => {
      return Promise.all([
        client.create('Heroes', { name: 'Anakin Skywalker' }),
        client.create('Heroes', { name: 'Obi-Wan' }),
        client.create('Heroes', { name: 'Yoda' })
      ]).then(response => {
        console.group();
        console.log('A Long Time Ago...'.rainbow);
        console.log(response);
        console.groupEnd();
        return client;
      });
    })
    .then(client => {
      client
        .list('Heroes', { range: 5 })
        .then(response => client.fieldData(response.data))
        .then(response => {
          console.group();
          console.log(
            ' For my ally is the Force, and a powerful ally it is.'.underline
              .green
          );
          console.log(response);
          console.groupEnd();
        })
        .catch(error => {
          console.group();
          console.log('That is no moon...'.red);
          console.log(error);
          console.groupEnd();
        });

      client
        .globals({ ship: 'Millenium Falcon' })
        .then(response => {
          console.group();
          console.log(
            'Made the Kessel Run in less than twelve parsecs.'.underline.blue
          );
          console.log(response);
          console.groupEnd();
        })
        .catch(error => {
          console.group();
          console.log('That is no moon...'.red);
          console.log(error);
          console.groupEnd();
        });

      return client;
    })
    .then(client =>
      client
        .find('Heroes', [{ name: 'Anakin Skywalker' }], { range: 1 })
        .then(response => client.recordId(response.data))
        .then(recordIds =>
          client.edit('Heroes', recordIds[0], { name: 'Darth Vader' })
        )
        .then(response => {
          console.group();
          console.log('I find your lack of faith disturbing'.underline.red);
          console.log(response);
          console.groupEnd();
        })
        .catch(error => {
          console.group();
          console.log('That is no moon...'.red);
          console.log(error);
          console.groupEnd();
        })
    );
});

const rewind = () => {
  Filemaker.findOne().then(client => {
    client
      .find('Heroes', [{ id: '*' }], { range: 150 })
      .then(response => client.recordId(response.data))
      .then(response => {
        console.group();
        console.log('Be Kind.... Rewind.....'.rainbow);
        console.log(response);
        console.groupEnd();
        return response;
      })
      .then(recordIds =>
        recordIds.forEach(id => {
          client.delete('Heroes', id).catch(error => {
            console.group();
            console.log('That is no moon...'.red);
            console.log(error);
            console.groupEnd();
          });
        })
      );
  });
};

setTimeout(function() {
  rewind();
}, 10000);
```

## Tests

```sh
npm install
npm test
```

```
> fms-api-client@0.0.5 test ./fms-api-client
> mocha --recursive ./tests
  FileMaker Data API Client
    ✓ should allow an instance to be saved.
    ✓ should authenticate into FileMaker. (165ms)
    ✓ should create FileMaker records. (243ms)
    ✓ should update FileMaker records.
    ✓ should delete FileMaker records.
    ✓ should get a FileMaker specific record.
    ✓ should allow you to list FileMaker records (419ms)
    ✓ should allow you to modify the FileMaker list response (403ms)
    ✓ should allow allow a list response to be set with numbers (332ms)
    ✓ should allow you to find FileMaker records (245ms)
    ✓ should allow you to set FileMaker globals (264ms)
  11 passing (2s)
```

## Dependencies

* [lodash](https://ghub.io/lodash): Lodash modular utilities.
* [moment](https://ghub.io/moment): Parse, validate, manipulate, and display dates
* [request](https://ghub.io/request): Simplified HTTP request client.
* [request-promise](https://ghub.io/request-promise): The simplified HTTP request client &#39;request&#39; with Promise support. Powered by Bluebird.

## Dev Dependencies

* [chai](https://ghub.io/chai): BDD/TDD assertion library for node.js and the browser. Test framework agnostic.
* [chai-as-promised](https://ghub.io/chai-as-promised): Extends Chai with assertions about promises.
* [colors](https://ghub.io/colors): get colors in your node.js console
* [dotenv](https://ghub.io/dotenv): Loads environment variables from .env file
* [eslint](https://ghub.io/eslint): An AST-based pattern checker for JavaScript.
* [eslint-config-google](https://ghub.io/eslint-config-google): ESLint shareable config for the Google style
* [eslint-config-prettier](https://ghub.io/eslint-config-prettier): Turns off all rules that are unnecessary or might conflict with Prettier.
* [eslint-plugin-prettier](https://ghub.io/eslint-plugin-prettier): Runs prettier as an eslint rule
* [jsdocs](https://ghub.io/jsdocs): jsdocs
* [minami](https://ghub.io/minami): Clean and minimal JSDoc 3 Template / Theme
* [mocha](https://ghub.io/mocha): simple, flexible, fun test framework
* [package-json-to-readme](https://ghub.io/package-json-to-readme): Generate a README.md from package.json contents
* [prettier](https://ghub.io/prettier): Prettier is an opinionated code formatter
* [varium](https://ghub.io/varium): A strict parser and validator of environment config variables

## License

MIT
