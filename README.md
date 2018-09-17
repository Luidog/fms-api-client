<!--@h1([pkg.name])-->
# fms-api-client
<!--/@-->

[![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client) [![Known Vulnerabilities](https://snyk.io/test/github/Luidog/fms-api-client/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Luidog/fms-api-client?targetFile=package.json) [![Coverage Status](https://coveralls.io/repos/github/Luidog/fms-api-client/badge.svg?branch=master)](https://coveralls.io/github/Luidog/fms-api-client?branch=master) [![GitHub issues](https://img.shields.io/github/issues/Luidog/fms-api-client.svg?style=plastic)](https://github.com/Luidog/fms-api-client/issues) [![Github commits (since latest release)](https://img.shields.io/github/commits-since/luidog/fms-api-client/latest.svg)](https://img.shields.io/github/issues/Luidog/fms-api-client.svg) [![GitHub license](https://img.shields.io/github/license/Luidog/fms-api-client.svg)](https://github.com/Luidog/fms-api-client/blob/master/LICENSE.md)

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

The fms-api-client is a wrapper around the [FileMaker Data API](https://fm.mutesymphony.com/fmi/data/apidoc/). Much :heart: to FileMaker for their work on the Data API. The client attempts to follow the terminology used by FileMaker wherever possible. the client uses a lightweight datastore to hold Data API connections. The client contains methods which are modeled after the Data API Endpoints.

### Datastore Connection

Connect must be called before the filemaker class is instiantiated. This connect uses Marpat.Marpat is a fork of Camo. Thanks and love to [Scott Robinson](https://github.com/scottwrobinson) for his creation and maintenance of Camo. My fork of Camo - Marpat is designed to allow the use of multiple datastores with the focus on encrypted file storage.

For more information on marpat and the different types of supported storage visit [marpat](https://github.com/Luidog/marpat)

<!--@snippet('./examples/index.js#datastore-connect-example', { showSource: true })-->
```js
connect('nedb://memory')
```

> Excerpt from [./examples/index.js](./examples/index.js#L24-L24)
<!--/@-->

### Client Creation

After connecting to a datastore you can import and create clients. A client is created using the create method on the client class. The client requires a server and application to connect to as well as valid credentials. Note that the server must be an http or https domain.

<!--@snippet('./examples/index.js#client-create-example', { showSource: true })-->
```js
    const client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
```

> Excerpt from [./examples/index.js](./examples/index.js#L28-L33)
<!--/@-->

A client can be used directly after saving it. It is also stored on the datastore so that it can be reused later.

<!--@snippet('./examples/index.js#client-save-example', { showSource: true })-->
```js
    return client
      .save()
      .then(client => authentication(client))
      .then(client => creates(client))
      .then(client => lists(client))
      .then(client => finds(client))
      .then(client => edits(client))
      .then(client => scripts(client))
      .then(client => globals(client))
      .then(client => deletes(client))
      .then(client => uploads(client))
      .then(client => utilities(client));
```

> Excerpt from [./examples/index.js](./examples/index.js#L36-L47)
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
  ]).then(result => log('create-many-records', result));
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

The client contains two methods related to authentication. The client has an authenticate method and the logout method.

#### Authenticate Method

The authenticate method is used to start a FileMaker user session and generate an authentication. The client will automatically call the authenticate method if it does not have a valid token. This method returns a string rather than an object. The string returned is the authentication token. This method will also save the token to the client's connection for future use.

**Note** The authenticate will change in an upcoming release. It will be modified to return an object.

<!--@snippet('./examples/authentication.examples.js#client-authenticate-example', { showSource: true })-->
```js
const login = client => client.authenticate();
```

> Excerpt from [./examples/authentication.examples.js](./examples/authentication.examples.js#L11-L11)
<!--/@-->

#### Logout Method

The logout method is used to close a FileMaker User session. This method will also remove the current client's authentication token.

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

<!--@snippet('./examples/create.examples.js#create-record-example', { showSource: true })-->
```js
const createRecord = client =>
  client
    .create('Heroes', {
      name: 'George Lucas'
    })
    .then(result => log('create-record', result));
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

The create method accepts the option of merge. If merge is true the data used to create the with DAPI's response object on success.

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
    .then(result => log('create-record-merge', result));
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
    .then(result => log('trigger-scripts-on-create', result));
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

### List Records

You can use the client to list filemaker records. The list method accepts a layout and parameter variable. The client will automatically santize the limit, offset, and sort keys to correspond with the DAPI's requirements.

<!--@snippet('./examples/list.examples.js#list-records-example', { showSource: true })-->
```js
const listHeroes = client =>
  client
    .list('Heroes', { limit: 5 })
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
        "id": "91C249FB-2127-8B47-9FBD-A4B004D95D5F",
        "name": "Yoda",
        "image(1)": "https://some-server.com/Streaming_SSL/MainDB/07680AA37D5FF57418036B4A1664401C5ED1C192845407761F52BDE15DAD2D7A?RCType=EmbeddedRCFileProcessor",
        "object": "",
        "array": "",
        "height": "",
        "image(2)": ""
      },
      "portalData": {
        "planets": []
      },
      "recordId": "729057",
      "modId": "1"
    },
    {
      "fieldData": {
        "id": "921B1983-2AC9-3647-9EC9-1C99F5BC7259",
        "name": "Darth Vader",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "image(2)": ""
      },
      "portalData": {
        "planets": []
      },
      "recordId": "729058",
      "modId": "1"
    },
    {
      "fieldData": {
        "id": "97A3CF0E-869C-EF42-821D-AF59AF650BD9",
        "name": "Obi-Wan",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "image(2)": ""
      },
      "portalData": {
        "planets": []
      },
      "recordId": "729061",
      "modId": "0"
    },
    {
      "fieldData": {
        "id": "8AFDEF46-0481-5644-8683-95EC04810BE1",
        "name": "",
        "image(1)": "https://some-server.com/Streaming_SSL/MainDB/691AF27E7EBA2A7BF58E2F52BD4756C46C9301CF7CCE14214C6763EEEF500423?RCType=EmbeddedRCFileProcessor",
        "object": "",
        "array": "",
        "height": "",
        "image(2)": ""
      },
      "portalData": {
        "planets": []
      },
      "recordId": "729064",
      "modId": "1"
    },
    {
      "fieldData": {
        "id": "BBA9D269-0089-F142-ABCA-A3194836C5D3",
        "name": "George Lucas",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "image(2)": ""
      },
      "portalData": {
        "planets": []
      },
      "recordId": "729065",
      "modId": "0"
    }
  ]
}
```

> File [./examples/results/list-records-example.json](./examples/results/list-records-example.json)
<!--/@-->

### Find Records

The client's find method will accept either a single object as find parameters or an array. The find method will also santize the limit,
sort, and offset parameters to conform with the Data API's requirements.

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
        "id": "A63A76F7-804E-C24A-BDB8-53B38598877C",
        "name": "Anakin Skywalker",
        "image(1)": "",
        "object": "",
        "array": "",
        "height": "",
        "image(2)": ""
      },
      "portalData": {
        "planets": []
      },
      "recordId": "729067",
      "modId": "0"
    }
  ]
}
```

> File [./examples/results/find-records-example.json](./examples/results/find-records-example.json)
<!--/@-->

### Edit Records

The client's edit method requires a layout, recordId, and object to use for updating the record.

<!--@snippet('./examples/edit.examples.js#edit-record-example', { showSource: true })-->
```js
const editRecords = client =>
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
  "modId": 1
}
```

> File [./examples/results/edit-record-example.json](./examples/results/edit-record-example.json)
<!--/@-->

### Delete Records

The client's delete method requires a layout and a record id.

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
    .find('Heroes', { name: 'yoda' })
    .then(response => recordId(response.data))
    .then(result => log('recordid-utility-example', result));
```

> Excerpt from [./examples/utility.examples.js](./examples/utility.examples.js#L7-L11)
<!--/@-->

Result:

<!--@snippet('./examples/results/recordid-utility-example.json', { showSource: true })-->
```json
[
  "729068",
  "729075",
  "729078"
]
```

> File [./examples/results/recordid-utility-example.json](./examples/results/recordid-utility-example.json)
<!--/@-->

#### fieldData Method

The fieldData method takes either an object or an array of objects and returns either a single object's
fieldData or an array of fieldData objects.

<!--@snippet('./examples/utility.examples.js#fielddata-utility-example', { showSource: true })-->
```js
const extractFieldData = client =>
  client
    .find('Heroes', { name: 'yoda' })
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
    "id": "F3EE8445-8F11-8D42-B5B8-5442A1D91CF3",
    "name": "Yoda",
    "image(1)": "https://some-server.com/Streaming_SSL/MainDB/AEE712BE129B381ABC9F7B1AFA64F3D8B0A08E17A24AD91AAAE58B163FCEE4CB?RCType=EmbeddedRCFileProcessor",
    "object": "",
    "array": "",
    "height": "",
    "image(2)": "",
    "recordId": "729068",
    "modId": "1"
  },
  {
    "id": "EE42F16D-1C92-CE47-91DF-C2BB6D8D9076",
    "name": "Yoda",
    "image(1)": "",
    "object": "",
    "array": "",
    "height": "",
    "image(2)": "",
    "recordId": "729075",
    "modId": "0"
  },
  {
    "id": "BBAC1BA6-6346-654F-A787-E62BD8D0D0EA",
    "name": "yoda",
    "image(1)": "",
    "object": "",
    "array": "",
    "height": "",
    "image(2)": "",
    "recordId": "729078",
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
> fms-api-client@1.4.5 test /Users/luidelaparra/Documents/Development/fms-api-client
> nyc _mocha --recursive  ./tests --timeout=30000 --exit



  Authentication Capabilities
    1) should authenticate into FileMaker.
    ✓ should automatically request an authentication token (6309ms)
    ✓ should reuse a saved authentication token (347ms)
    ✓ should log out of the filemaker. (277ms)
    ✓ should not attempt a logout if there is no valid token.
    ✓ should reject if the logout request fails (237ms)
    ✓ should reject if the authentication request fails (1477ms)

  Create Capabilities
    ✓ should create FileMaker records. (213ms)
    ✓ should reject bad data with an error (214ms)
    ✓ should create FileMaker records with mixed types (471ms)
    ✓ should substitute an empty object if data is not provided (210ms)
    ✓ should return an object with merged filemaker and data properties (261ms)
    ✓ should allow you to run a script when creating a record with a merge response (187ms)
    ✓ should allow you to specify scripts as an array (271ms)
    ✓ should allow you to specify scripts as an array with a merge response (3521ms)
    ✓ should sanitize parameters when creating a new record (254ms)
    ✓ should accept both the default script parameters and a scripts array (175ms)

  Delete Capabilities
    ✓ should delete FileMaker records. (403ms)
    ✓ should trigger scripts via an array when deleting records. (348ms)
    ✓ should trigger scripts via parameters when deleting records. (647ms)
    ✓ should allow you to mix script parameters and scripts array when deleting records. (387ms)
    ✓ should stringify script parameters. (303ms)
    ✓ should reject deletions that do not specify a recordId (246ms)
    ✓ should reject deletions that do not specify an invalid recordId (195ms)

  Edit Capabilities
    ✓ should edit FileMaker records.
    ✓ should reject bad data with an error (3413ms)
    ✓ should return an object with merged filemaker and data properties
    ✓ should allow you to run a script when editing a record (337ms)
    ✓ should allow you to run a script via a scripts array when editing a record (367ms)
    ✓ should allow you to specify scripts as an array (231ms)
    ✓ should allow you to specify scripts as an array with a merge response (810ms)
    ✓ should sanitize parameters when creating a new record (265ms)
    ✓ should accept both the default script parameters and a scripts array (211ms)

  Find Capabilities
    ✓ should perform a find request (292ms)
    ✓ should allow you to use an object instead of an array for a find (219ms)
    ✓ should specify omit Criterea (240ms)
    ✓ should allow additional parameters to manipulate the results (242ms)
    ✓ should allow you to limit the number of portal records to return (172ms)
    ✓ should allow you to use numbers in the find query parameters (721ms)
    ✓ should allow you to sort the results (223ms)
    ✓ should return an empty array if the find does not return results (227ms)
    ✓ should allow you run a pre request script (282ms)
    ✓ should return a response even if a script fails (234ms)
    ✓ should allow you to send a parameter to the pre request script (238ms)
    ✓ should allow you run script after the find and before the sort (491ms)
    ✓ should allow you to pass a parameter to a script after the find and before the sort (225ms)
    ✓ should reject of there is an issue with the find request (212ms)

  Get Capabilities
    ✓ should get specific FileMaker records. (376ms)
    ✓ should reject get requests that do not specify a recordId (342ms)
    ✓ should allow you to limit the number of portal records to return (339ms)
    ✓ should accept namespaced portal limit and offset parameters (922ms)

  Global Capabilities
    ✓ should allow you to set FileMaker globals (240ms)
    ✓ should reject with a message and code if it fails to set a global (239ms)

  Request Interceptor Capabilities
    ✓ should reject if the server errors (133ms)
    ✓ should handle non JSON responses by rejecting with a json error (96ms)
    ✓ should reject non http requests to the server with a json error
*Notice* Data API response does not contain a code
    ✓ should reject non https requests to the server with a json error (134ms)

  List Capabilities
    ✓ should allow you to list records (241ms)
    ✓ should allow you use parameters to modify the list response (268ms)
    ✓ should should allow you to use numbers in parameters (178ms)
    ✓ should should allow you to provide an array of portals in parameters (170ms)
    ✓ should should remove non used properties from a portal object (257ms)
    ✓ should modify requests to comply with DAPI name reservations (267ms)
    ✓ should allow strings while complying with DAPI name reservations (173ms)
    ✓ should allow you to offset the list response (272ms)
    ✓ should santize parameters that would cause unexpected parameters (211ms)
    ✓ should allow you to limit the number of portal records to return (244ms)
    ✓ should accept namespaced portal limit and offset parameters (795ms)
    ✓ should reject invalid parameters (276ms)

  Script Capabilities
    ✓ should allow you to trigger a script in FileMaker (285ms)
    ✓ should allow you to trigger a script in FileMaker (225ms)
    ✓ should allow you to trigger a script in a find (295ms)
    ✓ should allow you to trigger a script in a list (226ms)
    ✓ should allow reject a script that does not exist (229ms)
    ✓ should allow return a result even if a script returns an error (216ms)
    ✓ should parse script results if the results are json (244ms)
    ✓ should not parse script results if the results are not json (223ms)
    ✓ should parse an array of scripts (218ms)
    ✓ should trigger scripts on all three script phases (235ms)

  Storage
    ✓ should allow an instance to be created
    ✓ should allow an instance to be saved.
    ✓ should reject if a client can not be validated
    ✓ should allow an instance to be recalled
    ✓ should allow insances to be listed
    ✓ should allow you to remove an instance

  File Upload Capabilities
    ✓ should allow you to upload a file to a new record (1403ms)
    ✓ should allow you to upload a file to a specific container repetition (1713ms)
    ✓ should reject with a message if it can not find the file to upload
    ✓ should allow you to upload a file to a specific record (1424ms)
    ✓ should allow you to upload a file to a specific record container repetition (1501ms)
    ✓ should reject of the request is invalid (751ms)

  Data Usage 
    Tracks Data Usage
      ✓ should track API usage data. (214ms)
      ✓ should allow you to reset usage data. (206ms)
    Does Not Track Data Usage
      ✓ should not track data usage in (216ms)
      ✓ should not track data usage out (270ms)

  Utility Capabilities
    ✓ *Depricated* it should extract field while maintaining the array (337ms)
    ✓ *Depricated* it should extract field data while maintaining the object (400ms)
    ✓ *Depricated* it should extract the recordId while maintaining the array (472ms)
    ✓ *Depricated* it should extract field data while maintaining the object (3772ms)
    ✓ it should extract field while maintaining the array (658ms)
    ✓ it should extract field data while maintaining the object (370ms)
    ✓ it should extract the recordId while maintaining the array (367ms)
    ✓ it should extract field data while maintaining the object (339ms)
    ✓ it should remove properties while maintaing the array
    ✓ it should remove properties while maintaing the array


  104 passing (58s)
  1 failing

  1) Authentication Capabilities
       should authenticate into FileMaker.:
     Error: connect ETIMEDOUT 13.57.109.185:443
      at Object._errnoException (util.js:992:11)
      at _exceptionWithHostPort (util.js:1014:20)
      at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1186:14)



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
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! fms-api-client@1.4.5 test: `nyc _mocha --recursive  ./tests --timeout=30000 --exit`
npm ERR! Exit status 1
npm ERR! 
npm ERR! Failed at the fms-api-client@1.4.5 test script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/luidelaparra/.npm/_logs/2018-09-17T00_51_31_914Z-debug.log
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
