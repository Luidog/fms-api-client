# fms-api-client [![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client)

A FileMaker Data API client designed to allow easier interaction with a FileMaker application from a web environment.

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
   * A client can be used directly after saving it. It is also stored on the datastore
   * so that it can be reused later.
   */
  client.save().then(client =>
    client
      .create('Heroes', {
        name: 'George Lucas',
        number: 5,
        array: ['1'],
        object: { driods: true }
      })
      .then(record => {
        console.log(record);
        console.log('Some guy thought of a movie....'.yellow.underline, record);
      })
      .catch(error => console.log('That is no moon....'.red, error))
  );

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
        .script('example script', 'Heroes', {
          name: 'han',
          number: 102,
          object: { child: 'ben' },
          array: ['leia', 'chewbacca']
        })
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
> fms-api-client@0.0.7 test /Users/luidelaparra/Documents/Development/fms-api-client
> mocha --recursive ./tests
  FileMaker Data API Client
    ✓ should allow an instance to be saved.
    ✓ should authenticate into FileMaker. (155ms)
    ✓ should create FileMaker records. (169ms)
    ✓ should update FileMaker records.
    ✓ should delete FileMaker records.
    ✓ should get a FileMaker specific record.
    ✓ should allow you to list FileMaker records (218ms)
    ✓ should allow you to modify the FileMaker list response (165ms)
    ✓ should allow allow a list response to be set with numbers (158ms)
    ✓ should allow you to find FileMaker records (151ms)
    ✓ should allow you to set FileMaker globals (166ms)
  Client Script Capability
    ✓ should allow you to trigger a script in FileMaker (178ms)
    ✓ should allow you to trigger a script in a find (195ms)
  Client Upload Capability
    ✓ should allow you to upload a file to FileMaker (1362ms)
  Client Data Usage Tracking
    ✓ should track API usage data. (159ms)
  15 passing (3s)
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
