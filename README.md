# fms-api-client [![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client)

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

const environment = require('dotenv');
const varium = require('varium');
const colors = require('colors');
const { connect } = require('marpat');
const { Filemaker } = require('./filemaker');

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
        .catch(error =>
          console.log('globals - That is no moon....'.red, error)
        );

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
        .catch(error => console.log('find - That is no moon...'.red, error));

      client
        .upload('./images/placeholder.md', 'Heroes', 'image')
        .then(response => {
          console.log('Perhaps an Image...'.cyan.underline, response);
        })
        .catch(error => console.log('That is no moon...'.red, error));

      client
        .find('Heroes', [{ name: 'Luke Skywalker' }], { limit: 1 })
        .then(response => client.recordId(response.data))
        .then(recordIds =>
          client.upload(
            './images/placeholder.md',
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
      script: 'example script'
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
> fms-api-client@1.0.1 test /fms-api-client
> mocha --recursive ./tests
  Authentication Capabilities
    ✓ should authenticate into FileMaker. (141ms)
    ✓ should automatically request an authentication token (160ms)
    ✓ should reuse a saved authentication token (162ms)
  Create Capabilities
    ✓ should create FileMaker records. (159ms)
  Delete Capabilities
    ✓ should delete FileMaker records.
  Edit Capabilities
    ✓ should edit FileMaker records.
  Find Capabilities
    ✓ should perform a find request (205ms)
    ✓ should allow you to use an object instead of an array for a find (194ms)
    ✓ should specify omit Criterea (201ms)
    ✓ should allow additional parameters to manipulate the results (169ms)
    ✓ should allow you to use numbers in the find query parameters (159ms)
    ✓ should allow you to sort the results (194ms)
    ✓ should allow you run a pre request script (161ms)
    ✓ should allow you to send a parameter to the pre request script (167ms)
    ✓ should allow you run script after the find and before the sort (192ms)
    ✓ should allow you to pass a parameter to a script after the find and before the sort (204ms)
  Global Capabilities
    ✓ should allow you to set FileMaker globals (167ms)
  List Capabilities
    ✓ should allow you to list records (212ms)
    ✓ should allow you use parameters to modify the list response (158ms)
    ✓ should should allow you to use numbers in parameters (158ms)
    ✓ should modify requests to comply with DAPI name reservations (172ms)
    ✓ should allow strings while complying with DAPI name reservations (163ms)
    ✓ should allow you to offset the list response (158ms)
  Script Capabilities
    ✓ should allow you to trigger a script in FileMaker (168ms)
    ✓ should allow you to trigger a script in a find (197ms)
    ✓ should allow you to trigger a script in a list (162ms)
  Storage
    ✓ should allow an instance to be created
    ✓ should allow an instance to be saved.
    ✓ should allow an instance to be recalled
    ✓ should allow insances to be listed
    ✓ should allow you to remove an instance
  File Upload Capabilities
    ✓ should allow you to upload a file to FileMaker (1326ms)
  Data Usage Tracking Capabilities
    ✓ should track API usage data. (156ms)
    ✓ should allow you to reset usage data. (156ms)
  34 passing (6s)
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
