# fms-api-client [![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client)[![Coverage Status](https://coveralls.io/repos/github/Luidog/fms-api-client/badge.svg?branch=master)](https://coveralls.io/github/Luidog/fms-api-client?branch=master)

A FileMaker Data API client designed to allow easier interaction with a FileMaker application from a web environment.

For in depth documentation head to the [`docs`](https://luidog.github.io/fms-api-client)

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

/* eslint-disable */

const colors = require('colors');

/* eslint-enable */

const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('./index.js');
environment.config({ path: './tests/.env' });

varium(process.env, './tests/env.manifest');

/**
 * Connect must be called before the filemaker class is instiantiated. This
 * connect uses Marpat. Marpat is a fork of Camo. much love to
 * https://github.com/scottwrobinson for his creation and maintenance of Camo.
 * My fork of Camo - Marpat is designed to allow the use of multiple datastores
 * with the focus on encrypted storage.
 */

connect('nedb://memory').then(db => {
  /**
   * The client is the FileMaker class. The class then offers methods designed to
   * make it easier to integrate into filemaker's api.
   */

  const client = Filemaker.create({
    application: process.env.APPLICATION,
    server: process.env.SERVER,
    user: process.env.USERNAME,
    password: process.env.PASSWORD
  });

  /**
   * A client can be used directly after saving it. It is also stored on the
   * datastore so that it can be reused later.
   */
  client.save().then(client =>
    /**
     * Using the client you can create filemaker records. To create a record
     * specify the layout to use and the data to insert on creation. The client
     * will automatically convert numbers, arrays, and objects into strings so
     * they can be inserted into a filemaker field.
     */
    client
      .create('Heroes', {
        name: 'George Lucas',
        number: 5,
        array: ['1'],
        object: { driods: true }
      })
      .then(record =>
        console.log('Some guy thought of a movie....'.yellow.underline, record)
      )
      .catch(error => console.log('That is no moon....'.red, error))
  );
  /**
   * Most methods on the client are promises. The only exceptions to this are
   * the utility methods of fieldData(), and recordId(). You can chain together
   * multiple methods such as record creation.
   */
  client
    .save()
    .then(client => {
      return Promise.all([
        client.create('Heroes', { name: 'Anakin Skywalker' }),
        client.create('Heroes', { name: 'Obi-Wan' }),
        client.create('Heroes', { name: 'Yoda' })
      ]).then(response => {
        console.log('A Long Time Ago....'.rainbow.underline, response);
        return client;
      });
    })
    .then(client => {
      /**
       * You can use the client to list filemaker records. The List method
       * accepts a layout and parameter variable. The client will automatically
       * santize the limit, offset, and sort keys to correspond with the Data
       * API's requirements.
       */
      client
        .list('Heroes', { limit: 5 })
        .then(response => client.fieldData(response.data))
        .then(response =>
          console.log(
            ' For my ally is the Force, and a powerful ally it is.'.underline
              .green,
            response
          )
        )
        .catch(error => console.log('That is no moon....'.red, error));
      /**
       * You can also use the client to set FileMaker Globals for the session.
       */
      client
        .globals({ 'Globals::ship': 'Millenium Falcon' })
        .then(response =>
          console.log(
            'Made the Kessel Run in less than twelve parsecs.'.underline.blue,
            response
          )
        )
        .catch(error => console.log('That is no moon....'.red, error));

      return client;
    })
    .then(client => {
      /**
       * The client's find method  will accept either a single object as find
       * parameters or an array. The find method will also santize the limit,
       * sort, and offset parameters to conform with the Data API's
       * requirements.
       */
      client
        .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
        .then(response => client.recordId(response.data))
        .then(recordIds =>
          client.edit('Heroes', recordIds[0], { name: 'Darth Vader' })
        )
        .then(response =>
          console.log(
            'I find your lack of faith disturbing'.cyan.underline,
            response
          )
        )
        .catch(error => console.log('That is no moon...'.red, error));

      client
        .upload('./assets/placeholder.md', 'Heroes', 'image')
        .then(response => {
          console.log('Perhaps an Image...'.cyan.underline, response);
        })
        .catch(error => console.log('That is no moon...'.red, error));

      client
        .find('Heroes', [{ name: 'Luke Skywalker' }], { limit: 1 })
        .then(response => client.recordId(response.data))
        .then(recordIds =>
          client.upload(
            './assets/placeholder.md',
            'Heroes',
            'image',
            recordIds[0]
          )
        )
        .then(response => {
          console.log('Dont Forget Luke...'.cyan.underline, response);
        })
        .catch(error => console.log('That is no moon...'.red, error));

      client
        .script('FMS Triggered Script', 'Heroes')
        .then(response => {
          console.log('or a script....'.cyan.underline, response);
        })
        .catch(error => console.log('That is no moon...'.red, error));
    })
    .catch(error => console.log('That is no moon...'.red, error));

  client
    .find('Heroes', [{ name: 'Darth Vader' }], {
      limit: 1,
      script: 'example script',
      'script.param': 'han'
    })
    .then(response =>
      console.log(
        'I find your lack of faith disturbing'.cyan.underline,
        response
      )
    )
    .catch(error => console.log('find - That is no moon...'.red, error));
});

const rewind = () => {
  Filemaker.findOne().then(client => {
    console.log(client.data.status());
    client
      .find('Heroes', [{ id: '*' }], { limit: 10 })
      .then(response => client.recordId(response.data))
      .then(response => {
        console.log('Be Kind.... Rewind.....'.rainbow, response);
        return response;
      })
      .then(recordIds =>
        recordIds.forEach(id => {
          client
            .delete('Heroes', id)
            .catch(error => console.log('That is no moon....'.red, error));
        })
      );
  });
};

setTimeout(() => rewind(), 10000);
```

## Tests

```sh
npm install
npm test
```

```
> fms-api-client@1.1.1 test /Users/luidelaparra/Documents/Development/fms-api-client
> nyc _mocha --recursive ./tests --timeout=30000
  Authentication Capabilities
    ✓ should authenticate into FileMaker. (144ms)
    ✓ should automatically request an authentication token (169ms)
    ✓ should reuse a saved authentication token (164ms)
    ✓ should log out of the filemaker. (158ms)
    ✓ should not attempt a logout if there is no valid token.
    ✓ should reject if the logout request fails (153ms)
    ✓ should reject if the authentication request fails (1407ms)
  Create Capabilities
    ✓ should create FileMaker records. (160ms)
    ✓ should reject bad data with an error (153ms)
    ✓ should create FileMaker records with mixed types (157ms)
  Delete Capabilities
    ✓ should delete FileMaker records. (238ms)
    ✓ should reject deletions that do not specify a recordId (161ms)
  Edit Capabilities
    ✓ should edit FileMaker records.
    ✓ should reject bad data with an error (255ms)
  Find Capabilities
    ✓ should perform a find request (191ms)
    ✓ should allow you to use an object instead of an array for a find (194ms)
    ✓ should specify omit Criterea (189ms)
    ✓ should allow additional parameters to manipulate the results (163ms)
    ✓ should allow you to use numbers in the find query parameters (165ms)
    ✓ should allow you to sort the results (191ms)
    ✓ should return an empty array if the find does not return results (166ms)
    ✓ should allow you run a pre request script (175ms)
    ✓ should return a response even if a script fails (171ms)
    ✓ should allow you to send a parameter to the pre request script (164ms)
    ✓ should allow you run script after the find and before the sort (195ms)
    ✓ should allow you to pass a parameter to a script after the find and before the sort (201ms)
    ✓ should reject of there is an issue with the find request (155ms)
  Get Capabilities
    ✓ should get specific FileMaker records. (238ms)
    ✓ should reject get requests that do not specify a recordId (234ms)
  Global Capabilities
    ✓ should allow you to set FileMaker globals (167ms)
    ✓ should reject with a message and code if it fails to set a global (158ms)
  List Capabilities
    ✓ should allow you to list records (194ms)
    ✓ should allow you use parameters to modify the list response (160ms)
    ✓ should should allow you to use numbers in parameters (158ms)
    ✓ should modify requests to comply with DAPI name reservations (151ms)
    ✓ should allow strings while complying with DAPI name reservations (156ms)
    ✓ should allow you to offset the list response (164ms)
    ✓ should reject requests that use unexpected parameters (154ms)
  Script Capabilities
    ✓ should allow you to trigger a script in FileMaker (171ms)
    ✓ should allow you to trigger a script in FileMaker (175ms)
    ✓ should allow you to trigger a script in a find (206ms)
    ✓ should allow you to trigger a script in a list (158ms)
    ✓ should allow reject a script that does not exist (151ms)
    ✓ should allow return a result even if a script returns an error (167ms)
    ✓ should parse script results if the results are json (169ms)
    ✓ should not parse script results if the results are not json (163ms)
  Storage
    ✓ should allow an instance to be created
    ✓ should allow an instance to be saved.
    ✓ should allow an instance to be recalled
    ✓ should allow insances to be listed
    ✓ should allow you to remove an instance
  File Upload Capabilities
    ✓ should allow you to upload a file to a new record (1644ms)
    ✓ should allow you to upload a file to a specific container repetition (1346ms)
    ✓ should reject with a message if it can not find the file to upload (157ms)
    ✓ should allow you to upload a file to a specific record (1326ms)
  Data Usage Tracking Capabilities
    ✓ should track API usage data. (167ms)
    ✓ should allow you to reset usage data. (161ms)
  Utility Capabilities
    ✓ should extract field while maintaining the array (243ms)
    ✓ should extract field data while maintaining the object (236ms)
    ✓ should extract the recordId while maintaining the array (239ms)
    ✓ should extract field data while maintaining the object (231ms)
  61 passing (15s)
-----------------------|----------|----------|----------|----------|-------------------|
File                   |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
-----------------------|----------|----------|----------|----------|-------------------|
All files              |      100 |       95 |      100 |      100 |                   |
 fms-api-client        |      100 |      100 |      100 |      100 |                   |
  index.js             |      100 |      100 |      100 |      100 |                   |
 fms-api-client/src    |      100 |       95 |      100 |      100 |                   |
  client.model.js      |      100 |    94.74 |      100 |      100 |           194,581 |
  connection.model.js  |      100 |      100 |      100 |      100 |                   |
  credentials.model.js |      100 |      100 |      100 |      100 |                   |
  data.model.js        |      100 |      100 |      100 |      100 |                   |
  index.js             |      100 |      100 |      100 |      100 |                   |
-----------------------|----------|----------|----------|----------|-------------------|
```

## Dependencies

* [axios](https://ghub.io/axios): Promise based HTTP client for the browser and node.js
* [form-data](https://ghub.io/form-data): A library to create readable &quot;multipart/form-data&quot; streams. Can be used to submit forms and file uploads to other web applications.
* [lodash](https://ghub.io/lodash): Lodash modular utilities.
* [marpat](https://ghub.io/marpat): A class-based ES6 ODM for Mongo-like databases.
* [moment](https://ghub.io/moment): Parse, validate, manipulate, and display dates
* [object-sizeof](https://ghub.io/object-sizeof): Sizeof of a JavaScript object in Bytes
* [prettysize](https://ghub.io/prettysize): Convert bytes to other sizes for prettier logging

## Dev Dependencies

* [chai](https://ghub.io/chai): BDD/TDD assertion library for node.js and the browser. Test framework agnostic.
* [chai-as-promised](https://ghub.io/chai-as-promised): Extends Chai with assertions about promises.
* [colors](https://ghub.io/colors): get colors in your node.js console
* [coveralls](https://ghub.io/coveralls): takes json-cov output into stdin and POSTs to coveralls.io
* [dotenv](https://ghub.io/dotenv): Loads environment variables from .env file
* [eslint](https://ghub.io/eslint): An AST-based pattern checker for JavaScript.
* [eslint-config-google](https://ghub.io/eslint-config-google): ESLint shareable config for the Google style
* [eslint-config-prettier](https://ghub.io/eslint-config-prettier): Turns off all rules that are unnecessary or might conflict with Prettier.
* [eslint-plugin-prettier](https://ghub.io/eslint-plugin-prettier): Runs prettier as an eslint rule
* [jsdocs](https://ghub.io/jsdocs): jsdocs
* [minami](https://ghub.io/minami): Clean and minimal JSDoc 3 Template / Theme
* [mocha](https://ghub.io/mocha): simple, flexible, fun test framework
* [mocha-lcov-reporter](https://ghub.io/mocha-lcov-reporter): LCOV reporter for Mocha
* [nyc](https://ghub.io/nyc): the Istanbul command line interface
* [package-json-to-readme](https://ghub.io/package-json-to-readme): Generate a README.md from package.json contents
* [prettier](https://ghub.io/prettier): Prettier is an opinionated code formatter
* [varium](https://ghub.io/varium): A strict parser and validator of environment config variables

## License

MIT
