<!--@h1([pkg.name])-->
# fms-api-client
<!--/@-->

[![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client) [![Known Vulnerabilities](https://snyk.io/test/github/Luidog/fms-api-client/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Luidog/fms-api-client?targetFile=package.json) [![Coverage Status](https://coveralls.io/repos/github/Luidog/fms-api-client/badge.svg?branch=master)](https://coveralls.io/github/Luidog/fms-api-client?branch=master) [![GitHub issues](https://img.shields.io/github/issues/Luidog/fms-api-client.svg?style=plastic)](https://github.com/Luidog/fms-api-client/issues) [![Github commits (since latest release)](https://img.shields.io/github/commits-since/luidog/fms-api-client/latest.svg)](https://img.shields.io/github/issues/Luidog/fms-api-client.svg) [![GitHub license](https://img.shields.io/github/license/Luidog/fms-api-client.svg)](https://github.com/Luidog/fms-api-client/blob/master/LICENSE.md)

A FileMaker Data API client designed to allow easier interaction with a FileMaker application from a web environment. This client abstracts the FileMaker 17 Data API into class based methods. You can find detailed documentation on this project here:

[fms-api-client documentation](https://luidog.github.io/fms-api-client/)

<!--@installation()-->
## Installation

```sh
npm install --save fms-api-client
```
<!--/@-->

## Usage

### Introduction

The fms-api-client is a wrapper around the [FileMaker Data API](https://fm.mutesymphony.com/fmi/data/apidoc/). Much :heart: to FileMaker for their work on the Data API. The client attempts to follow the terminology used by FileMaker wherever possible. the client uses a lightweight datastore to hold Data API connections. The client contains methods which are modeled after the Data API Endpoints.

The client requires that you first connect to a datastore before creating or querying the FileMaker class. You can use the datastore to save a multitude of clients. Each client committed to the datastore will automatically handle Data API Sessions. Once recalled from the
data store a client's methods can be used to interact with a FileMaker Database without the need for additional authentication.

The client supports the same parameter syntax as is found in the [Data API Documentation](https://fm.mutesymphony.com/fmi/data/apidoc/). Where appropriate and useful the client also allows additional parameters. Any method that accepts script or portals in a query or body parameters will also accept the following script and portal parameters:

#### Script Array Syntax

The custom script parameter follows the following syntax:

<!--@snippet('./examples/schema/scripts-array-schema.json', { showSource: true })-->
```json
{
  "scripts": [
    {
      "name": "At Mos Eisley",
      "phase": "presort",
      "param": "awesome bar"
    },
    {
      "name": "First Shot",
      "phase": "prerequest",
      "param": "Han"
    },
    {
      "name": "Moof Milker",
      "param": "Greedo"
    }
  ]
}
```

> File [./examples/schema/scripts-array-schema.json](./examples/schema/scripts-array-schema.json)
<!--/@-->

#### Portal Array Syntax

The custom portal parameter follows the following syntax:

<!--@snippet('./examples/schema/portals-array-schema.json', { showSource: true })-->
```json
{
  "portals": [
    { "name": "planets", "limit": 1, "offset": 1 },
    { "name": "vehicles", "limit": 2 }
  ]
}
```

> File [./examples/schema/portals-array-schema.json](./examples/schema/portals-array-schema.json)
<!--/@-->

**Note:** The FileMaker script and portal syntax will override the alternative script and portal parameter syntax.

In addition to allowing an exanded syntax for invoking script or selecting portals the client will also automatically parse arrays, objects, and numbers to adhere to the requirements of the Data API. Arrays and objects are stringified before being inserted into field data. Also limits and offsets can be set as either a strings or a numbers.

The client will also automatically convert `limit`, `find`, and `offset` into their underscored conterparts as needed. Additionally, if a script result can be parsed as JSON it will be automatically parsed for you by the client.

All methods on the client return promises and each each method will reject with a message and code upon encountering an error. All messages and codes follow the FileMaker Data API where possible.

This project also provides utility modules to aid in working with FileMaker Data API Results. The provided utility modules are `fieldData`, `recordId`, and `transform`. These utilities will accept and return either an object or an an array objects. For more information on the utility modules see the utility section.

### Datastore Connection

Connect must be called before the FileMaker class is used. This connect uses Marpat. Marpat is a fork of Camo. Thanks and love to [Scott Robinson](https://github.com/scottwrobinson) for his creation and maintenance of Camo. My fork of Camo - Marpat is designed to allow the use of multiple datastores with the focus on encrypted file storage and project flexibility.

For more information on marpat and the different types of supported storage visit [marpat](https://github.com/Luidog/marpat)

<!--@snippet('./examples/index.js#datastore-connect-example', { showSource: true })-->
```js
const { connect } = require('marpat');
connect('nedb://memory')
```

> Excerpt from [./examples/index.js](./examples/index.js#L24-L25)
<!--/@-->

### Client Creation

After connecting to a datastore you can import and create clients. A client is created using the create method on the Filemaker class.
The FileMaker class accepts an object with the following properties:

| Property    |   Type  |                                           Description                                          |
| ----------- | :-----: | :--------------------------------------------------------------------------------------------: |
| application |  String |                  _required_ The FileMaker application / database to connect to                 |
| server      |  String | _required_ The FileMaker server to use as the host. **Note:** Must be an http or https Domain. |
| user        |  String |     _required_ The FileMaker user account to be used when authenticating into the Data API     |
| password    |  String |                        _required_ The FileMaker user account's password.                       |
| name        |  String |                                _optional_ A name for the client.                               |
| usage       | Boolean |          _optional_ Track Data API usage for this client. **Note:** Default is `true`          |

<!--@snippet('./examples/index.js#client-create-example', { showSource: true })-->
```js
    const client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      name: process.env.CLIENT_NAME,
      usage: process.env.CLIENT_USAGE_TRACKING,
      password: process.env.PASSWORD
    });
```

> Excerpt from [./examples/index.js](./examples/index.js#L29-L36)
<!--/@-->

**Note:** The server must be an http or https domain.

A client can be used directly after saving it. The `client.save()` method takes no arguments and will either reject with an error or resolve with a useable client. The client will automatically handle Data API session creation and expiration. Once a client is saved it will be stored on the datastore for reuse later.

<!--@snippet('./examples/index.js#client-save-example', { showSource: true })-->
```js
    return client
      .save()
      .then(client => authentication(client))
      .then(client => creates(client))
      .then(client => gets(client))
      .then(client => lists(client))
      .then(client => finds(client))
      .then(client => edits(client))
      .then(client => scripts(client))
      .then(client => globals(client))
      .then(client => deletes(client))
      // .then(client => uploads(client))
      .then(client => utilities(client));
```

> Excerpt from [./examples/index.js](./examples/index.js#L39-L51)
<!--/@-->

A client can be removed using either the `client.delete()` method, the `Filemaker.deleteOne(query)` method or the `FileMaker.deleteMany()` method.

**Note** Deleting a client does not close its Data API session. To close a session you need to call `client.logout()`.

### Client Use

A client can be used after it is created and saved or recalled from the datastore. The `Filemaker.find(query)` or `Filemaker.findOne(query)` methods can be used to recall clients. The `filemaker.findOne(query)` method will return either an client or null. The `filemaker.find(query)` will return an array of clients. All public methods on the client are return promises.

<!--@snippet('./examples/create.examples.js#create-many-records', { showSource: true })-->
```js
const createManyRecords = client =>
  Promise.all([
    client.create('Heroes', { name: 'Anakin Skywalker' }, { merge: true }),
    client.create('Heroes', { name: 'Obi-Wan' }, { merge: true }),
    client.create('Heroes', { name: 'Yoda' }, { merge: true })
  ]).then(result => log('create-many-records-example', result));
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L28-L33)
<!--/@-->

Results:

<!--@snippet('./examples/results/create-many-records.json', { showSource: true })-->
```json
[
  {
    "name": "Anakin Skywalker",
    "recordId": 729077,
    "modId": 0
  },
  {
    "name": "Obi-Wan",
    "recordId": 729073,
    "modId": 0
  },
  {
    "name": "Yoda",
    "recordId": 729075,
    "modId": 0
  }
]
```

> File [./examples/results/create-many-records.json](./examples/results/create-many-records.json)
<!--/@-->

### Authentication

The client will automatically handle creating and closing Data API sessions. If required the client will authenticate and generate a new session token with each method call. The Data API session is also monitored, updated, and saved as the client interacts with the Data API. Additionally, the client will always attempt to reuse a valid token whenever possible.

The client contains two methods related to Data API sessions.These methods are `client.authenticate` and `client.logout()`. The authenticate method is used to create a Data API session and the logout method will close a Data API session.

#### Authenticate Method

The client will automatically call the authenticate method if it does not have a valid token. This method returns a string rather than an object. The string returned is the authentication token. This method will also save the token to the client's connection for future use.

`client.authenticate()`

**Note** The authenticate will change in an upcoming release. It will be modified to return an object.

<!--@snippet('./examples/authentication.examples.js#client-authenticate-example', { showSource: true })-->
```js
const login = client => client.authenticate();
```

> Excerpt from [./examples/authentication.examples.js](./examples/authentication.examples.js#L11-L11)
<!--/@-->

#### Logout Method

The logout method is used to close a FileMaker User session. This method will also remove the current client's authentication token.

`client.logout()`

**Note** The logout method will change in an upcoming release. It will be modified to accept a session parameter.

<!--@snippet('./examples/authentication.examples.js#client-logout-example', { showSource: true })-->
```js
const logout = client =>
  client.logout().then(result => log('client-logout-example', result));
```

> Excerpt from [./examples/authentication.examples.js](./examples/authentication.examples.js#L6-L7)
<!--/@-->

### Create Records

Using the client you can create filemaker records. To create a record specify the layout to use and the data to insert on creation. The client will automatically convert numbers, arrays, and objects into strings so they can be inserted into a filemaker field.

`client.create(layout, data, parameters)`

<!--@snippet('./examples/create.examples.js#create-record-example', { showSource: true })-->
```js
const createRecord = client =>
  client
    .create('Heroes', {
      name: 'George Lucas'
    })
    .then(result => log('create-record-example', result));
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L6-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/create-record.json', { showSource: true })-->
```json
{
  "recordId": 729074,
  "modId": 0
}
```

> File [./examples/results/create-record.json](./examples/results/create-record.json)
<!--/@-->

Both the create method and the edit method accept a merge boolean in their options. If merge is true the data used to create or edit the filemaker record will be merged with

<!--@snippet('./examples/create.examples.js#create-record-merge', { showSource: true })-->
```js
const mergeDataOnCreate = client =>
  client
    .create(
      'Heroes',
      {
        name: 'George Lucas'
      },
      { merge: true }
    )
    .then(result => log('create-record-merge-example', result));
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L15-L24)
<!--/@-->

Result:

<!--@snippet('./examples/results/create-record-merge.json', { showSource: true })-->
```json
{
  "name": "George Lucas",
  "recordId": 729072,
  "modId": 0
}
```

> File [./examples/results/create-record-merge.json](./examples/results/create-record-merge.json)
<!--/@-->

The create methods also allows you to trigger scripts when creating a record. Notice the scripts property in the following example. You can specify scripts to run using either FileMaker's script.key syntax or specify an array of scripts with a name, phase, and script parameter.

<!--@snippet('./examples/create.examples.js#trigger-scripts-on-create', { showSource: true })-->
```js
const triggerScriptsOnCreate = client =>
  client
    .create(
      'Heroes',
      { name: 'Anakin Skywalker' },
      {
        merge: true,
        scripts: [
          { name: 'Create Droids', param: { droids: ['C3-PO', 'R2-D2'] } }
        ]
      }
    )
    .then(result => log('trigger-scripts-on-create-example', result));
```

> Excerpt from [./examples/create.examples.js](./examples/create.examples.js#L37-L49)
<!--/@-->

Result:

<!--@snippet('./examples/results/trigger-scripts-on-create.json', { showSource: true })-->
```json
{
  "name": "Anakin Skywalker",
  "scriptError": 0,
  "recordId": 729076,
  "modId": 0
}
```

> File [./examples/results/trigger-scripts-on-create.json](./examples/results/trigger-scripts-on-create.json)
<!--/@-->

### Get Record Details

`client.get(layout, recordId, parameters)`

<!--@snippet('./examples/get.examples.js#get-record-example', { showSource: true })-->
```js
      client
        .get('Heroes', response.data[0].recordId)
        .then(result => log('get-record-example', result))
```

> Excerpt from [./examples/get.examples.js](./examples/get.examples.js#L9-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/get-record-example.json', { showSource: true })-->
```json
{
  "data": [
    {
      "fieldData": {
        "name": "yoda",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "id": "D754E88F-1F3E-F541-A780-70E27F60ED71"
      },
      "portalData": {
        "Planets": [],
        "Vehicles": []
      },
      "recordId": "730245",
      "modId": "0"
    }
  ]
}
```

> File [./examples/results/get-record-example.json](./examples/results/get-record-example.json)
<!--/@-->

### List Records

You can use the client to list filemaker records. The list method accepts a layout and parameter variable. The client will automatically santize the limit, offset, and sort keys to correspond with the DAPI's requirements.

`client.list(layout, parameters)`

<!--@snippet('./examples/list.examples.js#list-records-example', { showSource: true })-->
```js
const listHeroes = client =>
  client
    .list('Heroes', { limit: 2 })
    .then(result => log('list-records-example', result));
```

> Excerpt from [./examples/list.examples.js](./examples/list.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/list-records-example.json', { showSource: true })-->
```json
{
  "data": [
    {
      "fieldData": {
        "name": "Obi-Wan",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "id": "A894746E-8FEB-0C44-B75B-BBB3BD1BEE73"
      },
      "portalData": {
        "Planets": [],
        "Vehicles": []
      },
      "recordId": "729949",
      "modId": "0"
    },
    {
      "fieldData": {
        "name": "George Lucas",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "id": "620A9B42-213A-474E-A46B-C0F3A26FC2B8"
      },
      "portalData": {
        "Planets": [],
        "Vehicles": []
      },
      "recordId": "729951",
      "modId": "0"
    }
  ]
}
```

> File [./examples/results/list-records-example.json](./examples/results/list-records-example.json)
<!--/@-->

### Find Records

The client's find method will accept either a single object as find parameters or an array. The find method will also santize the limit, sort, and offset parameters to conform with the Data API's requirements.

`client.find(layout, query, parameters)`

<!--@snippet('./examples/find.examples.js#find-records-example', { showSource: true })-->
```js
const findRecords = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(result => log('find-records-example', result));
```

> Excerpt from [./examples/find.examples.js](./examples/find.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/find-records-example.json', { showSource: true })-->
```json
{
  "data": [
    {
      "fieldData": {
        "name": "Anakin Skywalker",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "id": "B821AE04-BE94-1B48-A52D-CDEEF1516613"
      },
      "portalData": {
        "Planets": [],
        "Vehicles": []
      },
      "recordId": "730638",
      "modId": "0"
    }
  ]
}
```

> File [./examples/results/find-records-example.json](./examples/results/find-records-example.json)
<!--/@-->

### Edit Records

The client's edit method requires a layout, recordId, and object to use for updating the record.

`client.edit(layout, recordId, data, parameters)`

<!--@snippet('./examples/edit.examples.js#edit-record-example', { showSource: true })-->
```js
const editRecord = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.edit('Heroes', recordId, { name: 'Darth Vader' }))
    .then(result => log('edit-record-example', result));
```

> Excerpt from [./examples/edit.examples.js](./examples/edit.examples.js#L6-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/edit-record-example.json', { showSource: true })-->
```json
{
  "modId": 2
}
```

> File [./examples/results/edit-record-example.json](./examples/results/edit-record-example.json)
<!--/@-->

### Delete Records

The client's delete method requires a layout and a record id.

`client.delete(layout, recordId, parameters)`

<!--@snippet('./examples/delete.examples.js#delete-record-example', { showSource: true })-->
```js
const deleteRecords = client =>
  client
    .find('Heroes', [{ name: 'yoda' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.delete('Heroes', recordId))
    .then(result => log('delete-record-example', result));
```

> Excerpt from [./examples/delete.examples.js](./examples/delete.examples.js#L6-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/delete-record-example.json', { showSource: true })-->
```json
{}
```

> File [./examples/results/delete-record-example.json](./examples/results/delete-record-example.json)
<!--/@-->

### Trigger Scripts

The client's script method requires a script to run and a layout to run on.

`client.script(script, layout, parameter)`

**Note** The trigger script parameter order while change in a future release. It will be modified to swap the script name parameter with the layout parameter.

<!--@snippet('./examples/script.examples.js#script-trigger-example', { showSource: true })-->
```js
const triggerScript = client =>
  client
    .script('FMS Triggered Script', 'Heroes', { name: 'Han' })
    .then(result => log('script-trigger-example', result));
```

> Excerpt from [./examples/script.examples.js](./examples/script.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/script-trigger-example.json', { showSource: true })-->
```json
{
  "result": {
    "answer": "Han shot first"
  }
}
```

> File [./examples/results/script-trigger-example.json](./examples/results/script-trigger-example.json)
<!--/@-->

### Upload Files

The client's upload method will upload file data to a filemaker file. The upload method requires
a file path, layout, and container field name.

`client.upload(file, layout, containerFieldName, recordId, fieldRepetition)`

<!--@snippet('./examples/upload.examples.js#upload-image-example', { showSource: true })-->
```js
const uploadImage = client =>
  client
    .upload('./assets/placeholder.md', 'Heroes', 'image')
    .then(result => log('upload-image-example', result));
```

> Excerpt from [./examples/upload.examples.js](./examples/upload.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/upload-image-example.json', { showSource: true })-->
```json
{
  "modId": 1
}
```

> File [./examples/results/upload-image-example.json](./examples/results/upload-image-example.json)
<!--/@-->

You can also provide a record Id to the upload method and the file will be uploaded to that
record.

<!--@snippet('./examples/upload.examples.js#upload-specific-record-example', { showSource: true })-->
```js
const uploadSpecificImage = client =>
  client
    .find('Heroes', [{ name: 'yoda' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId =>
      client.upload('./assets/placeholder.md', 'Heroes', 'image', recordId)
    )
    .then(result => log('upload-specific-record-example', result));
```

> Excerpt from [./examples/upload.examples.js](./examples/upload.examples.js#L13-L20)
<!--/@-->

Result:

<!--@snippet('./examples/results/upload-specific-record-example.json', { showSource: true })-->
```json
{
  "modId": 1
}
```

> File [./examples/results/upload-specific-record-example.json](./examples/results/upload-specific-record-example.json)
<!--/@-->

### Set Session Globals

You can also use the client to set FileMaker Globals for the session.

`client.globals(object)`

<!--@snippet('./examples/globals.examples.js#set-globals-example', { showSource: true })-->
```js
const setGlobals = client =>
	client
		.globals({ 'Globals::ship': 'Millenium Falcon' })
		.then(result => log('set-globals-example', result));
```

> Excerpt from [./examples/globals.examples.js](./examples/globals.examples.js#L6-L9)
<!--/@-->

Result:

<!--@snippet('./examples/results/set-globals-example.json', { showSource: true })-->
```json
{}
```

> File [./examples/results/set-globals-example.json](./examples/results/set-globals-example.json)
<!--/@-->

### Utility Methods

The client also provides helper methods to aid in parsing and manipulating FileMaker Data. There are
currently to helper methods.

#### recordId Method

The recordId method takes either an object or an array of objects with recordId properties and returns
either a single recordId or an array of recordIds as strings.

`recordId(data)`

<!--@snippet('./examples/utility.examples.js#recordid-utility-example', { showSource: true })-->
```js
const extractRecordId = client =>
  client
    .find('Heroes', { name: 'yoda' }, { limit: 2 })
    .then(response => recordId(response.data))
    .then(result => log('recordid-utility-example', result));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L7-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/recordid-utility-example.json', { showSource: true })-->
```json
[
  "730246",
  "730252"
]
```

> File [./examples/results/recordid-utility-example.json](./examples/results/recordid-utility-example.json)
<!--/@-->

#### fieldData Method

The fieldData method takes either an object or an array of objects and returns either a single object's
fieldData or an array of fieldData objects.

`fieldData(data)`

<!--@snippet('./examples/utility.examples.js#fielddata-utility-example', { showSource: true })-->
```js
const extractFieldData = client =>
  client
    .find('Heroes', { name: 'yoda' }, { limit: 2 })
    .then(response => fieldData(response.data))
    .then(result => log('fielddata-utility-example', result));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L15-L19)
<!--/@-->

Result:

<!--@snippet('./examples/results/fielddata-utility-example.json', { showSource: true })-->
```json
[
  {
    "name": "Yoda",
    "image(1)": "",
    "object": "",
    "array": "",
    "height": "",
    "id": "458C3A79-CAEA-2E40-9871-EE9CDF61D939",
    "recordId": "730246",
    "modId": "0"
  },
  {
    "name": "yoda",
    "image(1)": "",
    "object": "",
    "array": "",
    "height": "",
    "id": "2C746603-2ECD-1647-9673-61FF0C251DF9",
    "recordId": "730252",
    "modId": "0"
  }
]
```

> File [./examples/results/fielddata-utility-example.json](./examples/results/fielddata-utility-example.json)
<!--/@-->

#### Transform Method

The transform method takes either an object or an array of objects and returns either a single object or an array. This method is used to transform and modify Data API responses.

`transform(data,options)`

<!--@snippet('./examples/utility.examples.js#fielddata-utility-example', { showSource: true })-->
```js
const extractFieldData = client =>
  client
    .find('Heroes', { name: 'yoda' }, { limit: 2 })
    .then(response => fieldData(response.data))
    .then(result => log('fielddata-utility-example', result));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L15-L19)
<!--/@-->

Result:

<!--@snippet('./examples/results/fielddata-utility-example.json', { showSource: true })-->
```json
[
  {
    "name": "Yoda",
    "image(1)": "",
    "object": "",
    "array": "",
    "height": "",
    "id": "458C3A79-CAEA-2E40-9871-EE9CDF61D939",
    "recordId": "730246",
    "modId": "0"
  },
  {
    "name": "yoda",
    "image(1)": "",
    "object": "",
    "array": "",
    "height": "",
    "id": "2C746603-2ECD-1647-9673-61FF0C251DF9",
    "recordId": "730252",
    "modId": "0"
  }
]
```

> File [./examples/results/fielddata-utility-example.json](./examples/results/fielddata-utility-example.json)
<!--/@-->

## Tests

```sh
npm install
npm test
```

<!--@execute('npm run test',[])-->
```default
> fms-api-client@1.5.0 test /Users/luidelaparra/Documents/Development/fms-api-client
> nyc _mocha --recursive  ./tests --timeout=30000 --exit



  Authentication Capabilities
    ✓ should authenticate into FileMaker. (148ms)
    ✓ should automatically request an authentication token (168ms)
    ✓ should reuse a saved authentication token (175ms)
    ✓ should log out of the filemaker. (166ms)
    ✓ should not attempt a logout if there is no valid token.
    ✓ should reject if the logout request fails (158ms)
    ✓ should reject if the authentication request fails (1453ms)

  Create Capabilities
    ✓ should create FileMaker records. (177ms)
    ✓ should reject bad data with an error (80ms)
    ✓ should create records with mixed types (110ms)
    ✓ should substitute an empty object if data is not provided (83ms)
    ✓ should return an object with merged data properties (81ms)
    ✓ should allow you to run a script when creating a record with a merge response (86ms)
    ✓ should allow you to specify scripts as an array (90ms)
    ✓ should allow you to specify scripts as an array with a merge response (90ms)
    ✓ should sanitize parameters when creating a new record (84ms)
    ✓ should accept both the default script parameters and a scripts array (92ms)
    ✓ should remove an expired token (79ms)

  Delete Capabilities
    ✓ should delete FileMaker records. (246ms)
    ✓ should trigger scripts via an array when deleting records. (162ms)
    ✓ should trigger scripts via parameters when deleting records. (149ms)
    ✓ should allow you to mix script parameters and scripts array when deleting records. (154ms)
    ✓ should stringify script parameters. (161ms)
    ✓ should reject deletions that do not specify a recordId (81ms)
    ✓ should reject deletions that do not specify an invalid recordId (87ms)
    ✓ should remove an expired token (78ms)

  Edit Capabilities
    ✓ should edit FileMaker records.
    ✓ should reject bad data with an error (247ms)
    ✓ should return an object with merged filemaker and data properties
    ✓ should allow you to run a script when editing a record (164ms)
    ✓ should allow you to run a script via a scripts array when editing a record (169ms)
    ✓ should allow you to specify scripts as an array (166ms)
    ✓ should allow you to specify scripts as an array with a merge response (158ms)
    ✓ should sanitize parameters when creating a editing record (167ms)
    ✓ should accept both the default script parameters and a scripts array (166ms)
    ✓ should remove an expired token (156ms)

  Find Capabilities
    ✓ should perform a find request (305ms)
    ✓ should allow you to use an object instead of an array for a find (203ms)
    ✓ should specify omit Criterea (159ms)
    ✓ should allow additional parameters to manipulate the results (78ms)
    ✓ should allow you to limit the number of portal records to return (92ms)
    ✓ should allow you to use numbers in the find query parameters (80ms)
    ✓ should allow you to sort the results (166ms)
    ✓ should return an empty array if the find does not return results (76ms)
    ✓ should allow you run a pre request script (82ms)
    ✓ should return a response even if a script fails (83ms)
    ✓ should allow you to send a parameter to the pre request script (85ms)
    ✓ should allow you run script after the find and before the sort (117ms)
    ✓ should allow you to pass a parameter to a script after the find and before the sort (125ms)
    ✓ should reject of there is an issue with the find request (75ms)
    ✓ should remove an expired token (73ms)

  Get Capabilities
    ✓ should get specific FileMaker records. (242ms)
    ✓ should reject get requests that do not specify a recordId (157ms)
    ✓ should allow you to limit the number of portal records to return (158ms)
    ✓ should accept namespaced portal limit and offset parameters (166ms)
    ✓ should remove an expired token (77ms)

  Global Capabilities
    ✓ should allow you to set session globals (164ms)
    ✓ should reject with a message and code if it fails to set a global (75ms)
    ✓ should remove an expired token (75ms)

  Request Interceptor Capabilities
    ✓ should reject if the server errors (115ms)
    ✓ should handle non JSON responses by rejecting with a json error (156ms)
    ✓ should reject non http requests to the server with a json error
 * Notice * Data API response does not contain a code. Only a message
    ✓ should reject non https requests to the server with a json error (136ms)

  List Capabilities
    ✓ should allow you to list records (297ms)
    ✓ should allow you use parameters to modify the list response (75ms)
    ✓ should should allow you to use numbers in parameters (74ms)
    ✓ should should allow you to provide an array of portals in parameters (79ms)
    ✓ should should remove non used properties from a portal object (85ms)
    ✓ should modify requests to comply with DAPI name reservations (78ms)
    ✓ should allow strings while complying with DAPI name reservations (81ms)
    ✓ should allow you to offset the list response (74ms)
    ✓ should santize parameters that would cause unexpected parameters (75ms)
    ✓ should allow you to limit the number of portal records to return (80ms)
    ✓ should accept namespaced portal limit and offset parameters (83ms)
    ✓ should reject invalid parameters (73ms)
    ✓ should remove an expired token (80ms)

  Script Capabilities
    ✓ should allow you to trigger a script (175ms)
    ✓ should allow you to trigger a script in a find (218ms)
    ✓ should allow you to trigger a script in a list (81ms)
    ✓ should allow reject a script that does not exist (75ms)
    ✓ should allow return a result even if a script returns an error (80ms)
    ✓ should parse script results if the results are json (91ms)
    ✓ should not parse script results if the results are not json (86ms)
    ✓ should parse an array of scripts (90ms)
    ✓ should trigger scripts on all three script phases (94ms)
    ✓ should remove an expired token (79ms)

  Storage
    ✓ should allow an instance to be created
    ✓ should allow an instance to be saved.
    ✓ should reject if a client can not be validated
    ✓ should allow an instance to be recalled
    ✓ should allow insances to be listed
    ✓ should allow you to remove an instance

  Transform Capabilities
    ✓ should merge portal data and field data from an array (321ms)
    ✓ should merge portal data and field data from an object (109ms)
    ✓ should optionally not convert table::field keys from an array (124ms)
    ✓ should optionally not convert table::field keys from an object (114ms)
    ✓ should allow you to remove field data from an array (113ms)
    ✓ should allow you to remove field data from an object (127ms)
    ✓ should allow you to remove portal data from an array (118ms)
    ✓ should allow you to remove portal data from an object (112ms)
    ✓ should merge portal data and portal data from an array (120ms)

  File Upload Capabilities
    ✓ should allow you to upload a file to a new record (1376ms)
    ✓ should allow you to upload a file to a specific container repetition (1262ms)
    ✓ should reject with a message if it can not find the file to upload
    ✓ should allow you to upload a file to a specific record (1260ms)
    ✓ should allow you to upload a file to a specific record container repetition (1265ms)
    ✓ should reject of the request is invalid (229ms)
    ✓ should remove an expired token (80ms)

  Data Usage 
    Tracks Data Usage
      ✓ should track API usage data. (173ms)
      ✓ should allow you to reset usage data. (85ms)
    Does Not Track Data Usage
      ✓ should not track data usage in (177ms)
      ✓ should not track data usage out (81ms)

  Utility Capabilities
    ✓ *Depricated* it should extract field while maintaining the array (265ms)
    ✓ *Depricated* it should extract field data while maintaining the object (167ms)
    ✓ *Depricated* it should extract the recordId while maintaining the array (159ms)
    ✓ *Depricated* it should extract field data while maintaining the object (168ms)
    ✓ it should extract field while maintaining the array (166ms)
    ✓ it should extract field data while maintaining the object (164ms)
    ✓ it should extract the recordId while maintaining the array (161ms)
    ✓ it should extract field data while maintaining the object (157ms)
    ✓ it should remove properties while maintaing the array
    ✓ it should remove properties while maintaing the object


  122 passing (21s)

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
  transform.utilities.js      |      100 |      100 |      100 |      100 |                   |
 fms-api-client/tests         |      100 |      100 |      100 |      100 |                   |
  transform.tests.js          |      100 |      100 |      100 |      100 |                   |
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
- [deep-map](https://github.com/mcmath/deep-map): Transforms nested values of complex objects
- [dotenv](https://github.com/motdotla/dotenv): Loads environment variables from .env file
- [eslint](https://github.com/eslint/eslint): An AST-based pattern checker for JavaScript.
- [eslint-config-google](https://github.com/google/eslint-config-google): ESLint shareable config for the Google style
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier): Turns off all rules that are unnecessary or might conflict with Prettier.
- [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier): Runs prettier as an eslint rule
- [fs-extra](https://github.com/jprichardson/node-fs-extra): fs-extra contains methods that aren't included in the vanilla Node.js fs package. Such as mkdir -p, cp -r, and rm -rf.
- [jsdoc](https://github.com/jsdoc3/jsdoc): An API documentation generator for JavaScript.
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
