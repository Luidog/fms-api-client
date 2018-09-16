<!--@h1([pkg.name])-->
# fms-api-client
<!--/@-->

[![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client) [![Known Vulnerabilities](https://snyk.io/test/github/Luidog/fms-api-client/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Luidog/fms-api-client?targetFile=package.json) [![Coverage Status](https://coveralls.io/repos/github/Luidog/fms-api-client/badge.svg?branch=master)](https://coveralls.io/github/Luidog/fms-api-client?branch=master) [![GitHub issues](https://img.shields.io/github/issues/Luidog/fms-api-client.svg?style=plastic)](https://github.com/Luidog/fms-api-client/issues) [![Github commits (since latest release)](https://img.shields.io/github/commits-since/luidog/fms-api-client/latest.svg)](https://img.shields.io/github/issues/Luidog/fms-api-client.svg)  [![GitHub license](https://img.shields.io/github/license/Luidog/fms-api-client.svg)](https://github.com/Luidog/fms-api-client/blob/master/LICENSE.md)

A FileMaker Data API client designed to allow easier interaction with a FileMaker application from a web environment. This client abstracts the FileMaker 17 Data API into class based methods. You can find detailed documentation on this project here:

[fms-api-client Documentation](https://luidog.github.io/fms-api-client/)

<!--@installation()-->
## Installation

```sh
npm install --save fms-api-client
```
<!--/@-->

## Usage

### Introduction

The fms-api-client is a wrapper around the [FileMaker Data API](https://fm.mutesymphony.com/fmi/data/apidoc/). Much :heart:
to FileMaker for their work on the Data API.

### Datastore Connection

Connect must be called before the filemaker class is instiantiated. This connect uses Marpat. 
Marpat is a fork of Camo. Thanks and love to [Scott Robinson](https://github.com/scottwrobinson) 
for his creation and maintenance of Camo. My fork of Camo - Marpat is designed to allow the 
use of multiple datastores with the focus on encrypted file storage.

For more information on marpat and the different types of supported storage visit [marpat](https://github.com/Luidog/marpat)

<!--@snippet('./examples/index.js#datastore-connect-example', { showSource: true })-->
```js
connect('nedb://memory')
```

> Excerpt from [./examples/index.js](./examples/index.js#L22-L22)
<!--/@-->

### Client Creation

After connecting to a datastore you can import and create clients. A client is created using
the create method on the client class. The client requires a server and application
to connect to as well as valid credentials. Note that the server must be an http or https domain.

<!--@snippet('./examples/index.js#client-create-example', { showSource: true })-->
```js
    const client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
```

> Excerpt from [./examples/index.js](./examples/index.js#L26-L31)
<!--/@-->

A client can be used directly after saving it. It is also stored on the
datastore so that it can be reused later.

<!--@snippet('./examples/index.js#client-save-example', { showSource: true })-->
```js
    return client
      .save()
      .then(client => creates(client, examples))
      .then(client => lists(client, examples))
      .then(client => globals(client, examples))
      .then(client => finds(client, examples))
      .then(client => scripts(client, examples))
      .then(client => edits(client, examples))
      .then(client => authentication(client, examples));
```

> Excerpt from [./examples/index.js](./examples/index.js#L34-L42)
<!--/@-->

### Client Use

All public methods on the client are promises. You can chain together multiple calls.

<!--@snippet('./examples/create.examples.js#create-many-records', { showSource: true })-->
```js
const createManyRecords = client =>
  Promise.all([
    client.create('Heroes', { name: 'Anakin Skywalker' }, { merge: true }),
    client.create('Heroes', { name: 'Obi-Wan' }, { merge: true }),
    client.create('Heroes', { name: 'Yoda' }, { merge: true })
  ]);
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L22-L27)
<!--/@-->

### Authentication

The client contains two methods for authentication. The authenticate method and the logout method.

#### Authenticate Method

The authenticate method is used to start a FileMaker user session and generate an authentication. 
The client will automatically call the authenticate method if it does not have a valid token.

<!--@snippet('./examples/authentication.examples.js#set-globals-example', { showSource: true })-->
<!--/@-->

#### Logout Method

The logout method is used to close a FileMaker User session. This method will also remove the current 
client's authenticationtoken.

<!--@snippet('./examples/authentication.examples.js#set-globals-example', { showSource: true })-->
<!--/@-->

### Create Records

Using the client you can create filemaker records. To create a record
specify the layout to use and the data to insert on creation. The client
will automatically convert numbers, arrays, and objects into strings so
they can be inserted into a filemaker field.

<!--@snippet('./examples/create.examples.js#create-record-example', { showSource: true })-->
```js
const createRecord = client =>
  client.create('Heroes', {
    name: 'George Lucas'
  });
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L4-L7)
<!--/@-->

The create method accepts the option of merge. If merge is true the data
used to create the with DAPI's response object on success.

<!--@snippet('./examples/create.examples.js#create-record-merge', { showSource: true })-->
```js
const mergeDataOnCreate = client =>
  client.create(
    'Heroes',
    {
      name: 'George Lucas'
    },
    { merge: true }
  );
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L11-L18)
<!--/@-->

The create methods also allows you to trigger scripts when creating a record. Notice the scripts
property in the following example. You can specify scripts to run using either FileMaker's script.key syntax
or specify an array of scripts with a name, phase, and script parameter.

<!--@snippet('./examples/create.examples.js#trigger-scripts-on-create', { showSource: true })-->
```js
const triggerScriptsOnCreate = client =>
  client.create(
    'Heroes',
    { name: 'Anakin Skywalker' },
    {
      merge: true,
      scripts: [
        { name: 'Create Droids', param: { droids: ['C3-PO', 'R2-D2'] } }
      ]
    }
  );
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L31-L41)
<!--/@-->

### List Records

You can use the client to list filemaker records. The List method
accepts a layout and parameter variable. The client will automatically
santize the limit, offset, and sort keys to correspond with the DAPI's
requirements.

<!--@snippet('./examples/list.examples.js#list-records-example', { showSource: true })-->
<!--/@-->

### Find Records

The client's find method  will accept either a single object as find
parameters or an array. The find method will also santize the limit,
sort, and offset parameters to conform with the Data API's
requirements.

<!--@snippet('./examples/find.examples.js#list-records-example', { showSource: true })-->
<!--/@-->

### Edit Records

The client's edit method requires a layout, recordId, and object to use for updating the record.

<!--@snippet('./examples/edit.examples.js#edit-record-example', { showSource: true })-->
<!--/@-->

### Delete Records

The client's delete method requires a layout and a record id.

<!--@snippet('./examples/delete.examples.js#delete-record-example', { showSource: true })-->
<!--/@-->

### Trigger Scripts

The client's script method requires a script to run and a layout to run on.

<!--@snippet('./examples/script.examples.js#script-trigger-example', { showSource: true })-->
<!--/@-->

### Upload Files

The client's upload method will upload file data to a filemaker file. The upload method requires 
a file path, layout, and container field name.

<!--@snippet('./examples/upload.examples.js#upload-image-example', { showSource: true })-->
<!--/@-->

You can also provide a record Id to the upload method and the file will be uploaded to that
record.

<!--@snippet('./examples/upload.examples.js#upload-specific-record-example', { showSource: true })-->
<!--/@-->

### Set Session Globals

You can also use the client to set FileMaker Globals for the session.

<!--@snippet('./examples/utility.examples.js#set-globals-example', { showSource: true })-->
<!--/@-->

### Helper Methods

The client also provides helper methods to aid in parsing and manipulating FileMaker Data. There are 
currently to helper methods. 

#### recordId Method

The recordId method takes either an object or an array of objects with recordId properties and returns
either a single recordId or an array of recordIds as strings.

<!--@snippet('./examples/utility.examples.js#recordId-utility-example', { showSource: true })-->
<!--/@-->

#### fieldData Method

The fieldData method takes either an object or an array of objects and returns either a single object's
fieldData or an array of fieldData objects.

<!--@snippet('./examples/utility.examples.js#fielddata-utility-example', { showSource: true })-->
<!--/@-->

## Tests

```sh
npm install
npm test
```

<!--@dependencies()-->
## <a name="dependencies">Dependencies</a>

- [axios](https://github.com/axios/axios): Promise based HTTP client for the browser and node.js
- [form-data](https://github.com/form-data/form-data): A library to create readable "multipart/form-data" streams. Can be used to submit forms and file uploads to other web applications.
- [lodash](https://github.com/lodash/lodash): Lodash modular utilities.
- [marpat](https://github.com/luidog/marpat): A class-based ES6 ODM for Mongo-like databases.
- [moment](https://github.com/moment/moment): Parse, validate, manipulate, and display dates
- [object-sizeof](https://github.com/miktam/sizeof): Sizeof of a JavaScript object in Bytes
- [prettysize](https://github.com/davglass/prettysize): Convert bytes to other sizes for prettier logging

<!--/@-->

<!--@devDependencies()-->
## <a name="dev-dependencies">Dev Dependencies</a>

- [chai](https://github.com/chaijs/chai): BDD/TDD assertion library for node.js and the browser. Test framework agnostic.
- [chai-as-promised](https://github.com/domenic/chai-as-promised): Extends Chai with assertions about promises.
- [colors](https://github.com/Marak/colors.js): get colors in your node.js console
- [coveralls](https://github.com/nickmerwin/node-coveralls): takes json-cov output into stdin and POSTs to coveralls.io
- [dotenv](https://github.com/motdotla/dotenv): Loads environment variables from .env file
- [eslint](https://github.com/eslint/eslint): An AST-based pattern checker for JavaScript.
- [eslint-config-google](https://github.com/google/eslint-config-google): ESLint shareable config for the Google style
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier): Turns off all rules that are unnecessary or might conflict with Prettier.
- [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier): Runs prettier as an eslint rule
- [jsdocs](https://github.com/xudafeng/jsdocs): jsdocs
- [minami](https://github.com/Nijikokun/minami): Clean and minimal JSDoc 3 Template / Theme
- [mocha](https://github.com/mochajs/mocha): simple, flexible, fun test framework
- [mocha-lcov-reporter](https://github.com/StevenLooman/mocha-lcov-reporter): LCOV reporter for Mocha
- [mos](https://github.com/mosjs/mos): A pluggable module that injects content into your markdown files via hidden JavaScript snippets
- [mos-plugin-dependencies](https://github.com/mosjs/mos/tree/master/packages/mos-plugin-dependencies): A mos plugin that creates dependencies sections
- [mos-plugin-execute](https://github.com/team-767/mos-plugin-execute): Mos plugin to inline a process output
- [mos-plugin-installation](https://github.com/mosjs/mos/tree/master/packages/mos-plugin-installation): A mos plugin for creating installation section
- [mos-plugin-license](https://github.com/mosjs/mos-plugin-license): A mos plugin for generating a license section
- [mos-plugin-snippet](https://github.com/mosjs/mos/tree/master/packages/mos-plugin-snippet): A mos plugin for embedding snippets from files
- [nyc](https://github.com/istanbuljs/nyc): the Istanbul command line interface
- [prettier](https://github.com/prettier/prettier): Prettier is an opinionated code formatter
- [varium](https://npmjs.org/package/varium): A strict parser and validator of environment config variables

<!--/@-->

<!--@license()-->
## License

MIT © Lui de la Parra
<!--/@-->
