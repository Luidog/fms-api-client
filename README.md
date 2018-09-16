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

> Excerpt from [./examples/index.js](./examples/index.js#L23-L23)
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

> Excerpt from [./examples/index.js](./examples/index.js#L27-L32)
<!--/@-->

A client can be used directly after saving it. It is also stored on the
datastore so that it can be reused later.

<!--@snippet('./examples/index.js#client-save-example', { showSource: true })-->
```js
    return client
      .save()
      .then(client => creates(client, examples))
      .then(client => lists(client, examples))
      .then(client => finds(client, examples))
      .then(client => edits(client, examples))
      .then(client => scripts(client, examples))
      .then(client => globals(client, examples))
      .then(client => deletes(client, examples))
      .then(client => authentication(client, examples));
```

> Excerpt from [./examples/index.js](./examples/index.js#L35-L44)
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

<!--@snippet('./examples/authentication.examples.js#client-authenticate-example', { showSource: true })-->
```js
const login = client => client.authenticate();
```

> Excerpt from [./examples/authentication.examples.js](./examples/authentication.examples.js#L8-L8)
<!--/@-->

#### Logout Method

The logout method is used to close a FileMaker User session. This method will also remove the current 
client's authenticationtoken.

<!--@snippet('./examples/authentication.examples.js#client-logout-example', { showSource: true })-->
```js
const logout = client => client.logout();
```

> Excerpt from [./examples/authentication.examples.js](./examples/authentication.examples.js#L4-L4)
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
```js
const listHeroes = client =>
  client.list('Heroes', { limit: 5 }).then(response => response.data);
```

> Excerpt from [./examples/list.examples.js](./examples/list.examples.js#L4-L5)
<!--/@-->

### Find Records

The client's find method  will accept either a single object as find
parameters or an array. The find method will also santize the limit,
sort, and offset parameters to conform with the Data API's
requirements.

<!--@snippet('./examples/find.examples.js#find-records-example', { showSource: true })-->
```js
const findRecords = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(response => client.recordId(response.data))
    .then(recordIds =>
      client.edit('Heroes', recordIds[0], { name: 'Darth Vader' })
    );
```

> Excerpt from [./examples/find.examples.js](./examples/find.examples.js#L4-L10)
<!--/@-->

### Edit Records

The client's edit method requires a layout, recordId, and object to use for updating the record.

<!--@snippet('./examples/edit.examples.js#edit-record-example', { showSource: true })-->
```js
        client.edit('Heroes', recordId, { name: 'Darth Vader' })
```

> Excerpt from [./examples/edit.examples.js](./examples/edit.examples.js#L10-L10)
<!--/@-->

### Delete Records

The client's delete method requires a layout and a record id.

<!--@snippet('./examples/delete.examples.js#delete-record-example', { showSource: true })-->
```js
const deleteRecords = client =>
  client
    .find('Heroes', [{ name: 'Mace Windu' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.delete('Heroes', recordId));
```

> Excerpt from [./examples/delete.examples.js](./examples/delete.examples.js#L4-L8)
<!--/@-->

### Trigger Scripts

The client's script method requires a script to run and a layout to run on.

<!--@snippet('./examples/script.examples.js#script-trigger-example', { showSource: true })-->
```js
const triggerScript = client => client.script('FMS Triggered Script', 'Heroes');
```

> Excerpt from [./examples/script.examples.js](./examples/script.examples.js#L4-L4)
<!--/@-->

### Upload Files

The client's upload method will upload file data to a filemaker file. The upload method requires 
a file path, layout, and container field name.

<!--@snippet('./examples/upload.examples.js#upload-image-example', { showSource: true })-->
```js
const uploadImage = client =>
  client.upload('./assets/placeholder.md', 'Heroes', 'image');
```

> Excerpt from [./examples/upload.examples.js](./examples/upload.examples.js#L4-L5)
<!--/@-->

You can also provide a record Id to the upload method and the file will be uploaded to that
record.

<!--@snippet('./examples/upload.examples.js#upload-specific-record-example', { showSource: true })-->
```js
        client.upload('./assets/placeholder.md', 'Heroes', 'image', recordId)
```

> Excerpt from [./examples/upload.examples.js](./examples/upload.examples.js#L15-L15)
<!--/@-->

### Set Session Globals

You can also use the client to set FileMaker Globals for the session.

<!--@snippet('./examples/globals.examples.js#set-globals-example', { showSource: true })-->
```js
const setGlobals = client =>
  client.globals({ 'Globals::ship': 'Millenium Falcon' });
```

> Excerpt from [./examples/globals.examples.js](./examples/globals.examples.js#L4-L5)
<!--/@-->

### Helper Methods

The client also provides helper methods to aid in parsing and manipulating FileMaker Data. There are 
currently to helper methods. 

#### recordId Method

The recordId method takes either an object or an array of objects with recordId properties and returns
either a single recordId or an array of recordIds as strings.

<!--@snippet('./examples/utility.examples.js#recordid-utility-example', { showSource: true })-->
```js
const extractRecordId = client =>
  client
    .find('Heroes', { name: 'Luke Skywalker' })
    .then(response => recordId(response.data));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L6-L9)
<!--/@-->

#### fieldData Method

The fieldData method takes either an object or an array of objects and returns either a single object's
fieldData or an array of fieldData objects.

<!--@snippet('./examples/utility.examples.js#fielddata-utility-example', { showSource: true })-->
```js
const extractFieldData = client =>
  client
    .find('Heroes', { name: 'Luke Skywalker' })
    .then(response => fieldData(response.data));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L13-L16)
<!--/@-->

## Tests

```sh
npm install
npm test
```
<!--@execute('npm run test',[])-->
```default
> fms-api-client@1.4.5 test /Users/luidelaparra/Documents/Development/fms-api-client
> nyc _mocha --recursive  ./tests --timeout=30000 --exit



  Authentication Capabilities
    ✓ should authenticate into FileMaker. (159ms)
    ✓ should automatically request an authentication token (190ms)
    ✓ should reuse a saved authentication token (168ms)
    ✓ should log out of the filemaker. (255ms)
    ✓ should not attempt a logout if there is no valid token.
    ✓ should reject if the logout request fails (220ms)
    ✓ should reject if the authentication request fails (1416ms)

  Create Capabilities
    ✓ should create FileMaker records. (175ms)
    ✓ should reject bad data with an error (221ms)
    ✓ should create FileMaker records with mixed types (170ms)
    ✓ should substitute an empty object if data is not provided (176ms)
    ✓ should return an object with merged filemaker and data properties (168ms)
    ✓ should allow you to run a script when creating a record with a merge response (186ms)
    ✓ should allow you to specify scripts as an array (235ms)
    ✓ should allow you to specify scripts as an array with a merge response (298ms)
    ✓ should sanitize parameters when creating a new record (238ms)
    ✓ should accept both the default script parameters and a scripts array (183ms)

  Delete Capabilities
    ✓ should delete FileMaker records. (256ms)
    ✓ should trigger scripts via an array when deleting records. (284ms)
    ✓ should trigger scripts via parameters when deleting records. (251ms)
    ✓ should allow you to mix script parameters and scripts array when deleting records. (266ms)
    ✓ should stringify script parameters. (347ms)
    ✓ should reject deletions that do not specify a recordId (167ms)
    ✓ should reject deletions that do not specify an invalid recordId (194ms)

  Edit Capabilities
    ✓ should edit FileMaker records.
    ✓ should reject bad data with an error (247ms)
    ✓ should return an object with merged filemaker and data properties
    ✓ should allow you to run a script when editing a record (269ms)
    ✓ should allow you to run a script via a scripts array when editing a record (349ms)
    ✓ should allow you to specify scripts as an array (175ms)
    ✓ should allow you to specify scripts as an array with a merge response (184ms)
    ✓ should sanitize parameters when creating a new record (179ms)
    ✓ should accept both the default script parameters and a scripts array (209ms)

  Find Capabilities
    ✓ should perform a find request (267ms)
    ✓ should allow you to use an object instead of an array for a find (293ms)
    ✓ should specify omit Criterea (259ms)
    ✓ should allow additional parameters to manipulate the results (170ms)
    ✓ should allow you to limit the number of portal records to return (171ms)
    ✓ should allow you to use numbers in the find query parameters (169ms)
    ✓ should allow you to sort the results (420ms)
    ✓ should return an empty array if the find does not return results (164ms)
    ✓ should allow you run a pre request script (178ms)
    ✓ should return a response even if a script fails (197ms)
    ✓ should allow you to send a parameter to the pre request script (178ms)
    ✓ should allow you run script after the find and before the sort (420ms)
    ✓ should allow you to pass a parameter to a script after the find and before the sort (448ms)
    ✓ should reject of there is an issue with the find request (167ms)

  Get Capabilities
    ✓ should get specific FileMaker records. (254ms)
    ✓ should reject get requests that do not specify a recordId (247ms)
    ✓ should allow you to limit the number of portal records to return (245ms)
    ✓ should accept namespaced portal limit and offset parameters (348ms)

  Global Capabilities
    ✓ should allow you to set FileMaker globals (171ms)
    ✓ should reject with a message and code if it fails to set a global (165ms)

  Request Interceptor Capabilities
    ✓ should reject if the server errors (137ms)
    ✓ should handle non JSON responses by rejecting with a json error (120ms)
    ✓ should reject non http requests to the server with a json error
*Notice* Data API response does not contain a code
    ✓ should reject non https requests to the server with a json error (170ms)

  List Capabilities
    ✓ should allow you to list records (254ms)
    ✓ should allow you use parameters to modify the list response (216ms)
    ✓ should should allow you to use numbers in parameters (169ms)
    ✓ should should allow you to provide an array of portals in parameters (235ms)
    ✓ should should remove non used properties from a portal object (173ms)
    ✓ should modify requests to comply with DAPI name reservations (189ms)
    ✓ should allow strings while complying with DAPI name reservations (175ms)
    ✓ should allow you to offset the list response (169ms)
    ✓ should santize parameters that would cause unexpected parameters (192ms)
    ✓ should allow you to limit the number of portal records to return (199ms)
    ✓ should accept namespaced portal limit and offset parameters (175ms)
    ✓ should reject invalid parameters (185ms)

  Script Capabilities
    ✓ should allow you to trigger a script in FileMaker (206ms)
    ✓ should allow you to trigger a script in FileMaker (256ms)
    ✓ should allow you to trigger a script in a find (262ms)
    ✓ should allow you to trigger a script in a list (205ms)
    ✓ should allow reject a script that does not exist (166ms)
    ✓ should allow return a result even if a script returns an error (179ms)
    ✓ should parse script results if the results are json (220ms)
    ✓ should not parse script results if the results are not json (254ms)
    ✓ should parse an array of scripts (182ms)
    ✓ should trigger scripts on all three script phases (188ms)

  Storage
    ✓ should allow an instance to be created
    ✓ should allow an instance to be saved.
    ✓ should reject if a client can not be validated
    ✓ should allow an instance to be recalled
    ✓ should allow insances to be listed
    ✓ should allow you to remove an instance

  File Upload Capabilities
    ✓ should allow you to upload a file to a new record (1378ms)
    ✓ should allow you to upload a file to a specific container repetition (1534ms)
    ✓ should reject with a message if it can not find the file to upload
    ✓ should allow you to upload a file to a specific record (1353ms)
    ✓ should allow you to upload a file to a specific record container repetition (1380ms)
    ✓ should reject of the request is invalid (314ms)

  Data Usage 
    Tracks Data Usage
      ✓ should track API usage data. (186ms)
      ✓ should allow you to reset usage data. (219ms)
    Does Not Track Data Usage
      ✓ should not track data usage in (185ms)
      ✓ should not track data usage out (170ms)

  Utility Capabilities
    ✓ *Depricated* it should extract field while maintaining the array (269ms)
    ✓ *Depricated* it should extract field data while maintaining the object (259ms)
    ✓ *Depricated* it should extract the recordId while maintaining the array (252ms)
    ✓ *Depricated* it should extract field data while maintaining the object (273ms)
    ✓ it should extract field while maintaining the array (299ms)
    ✓ it should extract field data while maintaining the object (275ms)
    ✓ it should extract the recordId while maintaining the array (330ms)
    ✓ it should extract field data while maintaining the object (242ms)
    ✓ it should remove properties while maintaing the array
    ✓ it should remove properties while maintaing the array


  105 passing (27s)

------------------------------|----------|----------|----------|----------|-------------------|
File                          |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
------------------------------|----------|----------|----------|----------|-------------------|
All files                     |      100 |      100 |      100 |      100 |                   |
 fms-api-client               |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
 fms-api-client/src           |      100 |      100 |      100 |      100 |                   |
  client.model.js             |      100 |      100 |      100 |      100 |                   |
  connection.model.js         |      100 |      100 |      100 |      100 |                   |
  credentials.model.js        |      100 |      100 |      100 |      100 |                   |
  data.model.js               |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
  request.service.js          |      100 |      100 |      100 |      100 |                   |
 fms-api-client/src/utilities |      100 |      100 |      100 |      100 |                   |
  conversion.utilities.js     |      100 |      100 |      100 |      100 |                   |
  filemaker.utilities.js      |      100 |      100 |      100 |      100 |                   |
  index.js                    |      100 |      100 |      100 |      100 |                   |
------------------------------|----------|----------|----------|----------|-------------------|
```
<!--/@-->

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
