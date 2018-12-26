
# fms-api-client

[![Build Status](https://travis-ci.org/Luidog/fms-api-client.png?branch=master)](https://travis-ci.org/Luidog/fms-api-client) [![Known Vulnerabilities](https://snyk.io/test/github/Luidog/fms-api-client/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Luidog/fms-api-client?targetFile=package.json) [![Coverage Status](https://coveralls.io/repos/github/Luidog/fms-api-client/badge.svg?branch=master)](https://coveralls.io/github/Luidog/fms-api-client?branch=master) [![GitHub issues](https://img.shields.io/github/issues/Luidog/fms-api-client.svg?style=plastic)](https://github.com/Luidog/fms-api-client/issues) [![Github commits (since latest release)](https://img.shields.io/github/commits-since/luidog/fms-api-client/latest.svg)](https://img.shields.io/github/issues/Luidog/fms-api-client.svg) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![GitHub license](https://img.shields.io/github/license/Luidog/fms-api-client.svg)](https://github.com/Luidog/fms-api-client/blob/master/LICENSE.md)

A FileMaker Data API client designed to allow easier interaction with a FileMaker application from a web environment. This client abstracts the FileMaker 17 Data API into class based methods. You can find detailed documentation on this project here:

[fms-api-client documentation](https://luidog.github.io/fms-api-client/)

## Installation

```sh
npm install --save fms-api-client
```

## Usage

### Introduction

The fms-api-client is a wrapper around the [FileMaker Data API](https://fm.mutesymphony.com/fmi/data/apidoc/). Much :heart: to FileMaker for their work on the Data API. This client attempts to follow the terminology used by FileMaker wherever possible. The client uses a lightweight datastore to hold Data API connections. Each client has methods which are modeled after the Data API endpoints.

fms-api-client requires that you first connect to a datastore before creating or querying the FileMaker class. Once connected you can use the datastore to save a multitude of clients. 

Each client committed to the datastore will automatically handle Data API Sessions. If needed the clients can manually open or close their FileMaker sessions by calling either the `client.login()` method or the `client.logout()` method.

To remove a client from a datastore and log out a session call `client.destroy()`.

The client supports the same parameter syntax as is found in the [Data API Documentation](https://fm.mutesymphony.com/fmi/data/apidoc/). Where appropriate and useful the client also allows additional parameters. 

Any method that accepts script or portals in query or body parameters will also accept the following script and portal parameter syntax:

#### Script Array Syntax

The custom script parameter follows the following syntax:


#### Portals Array Syntax

The custom portals parameter follows the following syntax:


**Note:** The FileMaker script and portal syntax will override the alternative scripts and portals parameter syntax.

In addition to allowing an exanded syntax for invoking scripts or selecting portals the client will also automatically parse arrays, objects, and numbers to adhere to the requirements of the Data API.

#### Data Syntax


Arrays and objects are stringified before being inserted into field or portal data. `limit` and `offset` parameters can be either strings or a numbers.

The client will also automatically convert `limit`, `find`, and `offset` parameters into their underscored conterparts as needed. Additionally, if a script result can be parsed as JSON it will be automatically parsed for you by the client. 

The client accepts the same sort parameters as the Data API. 

#### Sort Syntax


When using the `find` method a query is required. The query can either be a single json object or an array of json objects.

#### Query Syntax


All methods on the client return promises and each method will reject with a message and code upon encountering an error. All messages and codes follow the FileMaker Data API codes where applicable. 

fms-api-client also provides utility modules to aid in working with FileMaker Data API Results. The provided utility modules are `fieldData`, `recordId`, and `transform`. These utilities will accept and return either an object or an an array objects. For more information on the utility modules see the utility section.

### Datastore Connection

The connect  method must be called before the FileMaker class is used. The connect method is not currently exposed by fms-api-client, but from the marpat dependency. marpat is a fork of camo. Thanks and love to [Scott Robinson](https://github.com/scottwrobinson) for his creation and maintenance of camo.

marpat is designed to allow the use of multiple datastores with the focus on encrypted file storage and project flexibility.

For more information on marpat and the different types of supported storage visit [marpat](https://github.com/Luidog/marpat)


### Client Creation

After connecting to a datastore you can import and create clients. A client is created using the create method on the Filemaker class. The FileMaker class accepts an object with the following properties:

| Property    |   Type  |                                            Description                                           |
| ----------- | :-----: | :----------------------------------------------------------------------------------------------: |
| application |  String |                  **required** The FileMaker application / database to connect to                 |
| server      |  String | **required** The FileMaker server to use as the host. **Note:** Must be an http or https Domain. |
| user        |  String |     **required** The FileMaker user account to be used when authenticating into the Data API     |
| password    |  String |                        **required** The FileMaker user account's password.                       |
| name        |  String |                                **optional** A name for the client.                               |
| usage       | Boolean |          **optional** Track Data API usage for this client. **Note:** Default is `true`          |
| timeout     |  Number |      **optional** The default timeout time for requests **Note:** Default is 0, (no timeout)     |
| proxy       |  Object |                             **optional** settings for a proxy server                             |
| agent       |  Object |                         **optional** settings for a custom request agent                         |

:warning: You should only use the agent parameter when absolutely necessary. The Data API was designed to be used on https. Deviating from the intended use should be done with caution.


**Note:** The server must be an http or https domain.

A client can be used directly after saving it. The `client.save()` method takes no arguments and will either reject with an error or resolve with a useable client. The client will automatically handle Data API session creation and expiration. Once a client is saved it will be stored on the datastore for reuse later.


A client can be removed using either the `client.destroy()` method, the `Filemaker.deleteOne(query)` method or the `Filemaker.deleteMany(query)` method.

**Note** Only the `client.destroy()` method will close a FileMaker session. Any client removed using the the `Filemaker.deleteOne(query)` method or the `Filemaker.deleteMany(query)` method will not log out before being destroyed.

### Client Use

A client can be used after it is created and saved or recalled from the datastore. The `Filemaker.find(query)` or `Filemaker.findOne(query)` methods can be used to recall clients. The `Filemaker.findOne(query)` method will return either one client or null. The `Filemaker.find(query)` will return either an empty array or an array of clients. All public methods on the client return promises.


Results:


### Data API Sessions

The client will automatically handle creating and closing Data API sessions. If required the client will authenticate and generate a new session token with each method call. 

The Data API session is also monitored, updated, and saved as the client interacts with the Data API. A client will always attempt to reuse a valid token whenever possible.

The client contains two methods related to Data API sessions. These methods are `client.login()` and `client.logout()`. The login method is used to start a Data API session and the logout method will end a Data API session.

#### Login Method

The client will automatically call the login method if it does not have a valid token. This method returns an object with a token property. This method will also save the token to the client's connection for future use.

`client.login()`


#### Logout Method

The logout method is used to end a Data API session. This method will also remove the current client's authentication token.

`client.logout()`


### Create Records

Using the client you can create filemaker records. To create a record specify the layout to use and the data to insert on creation. The client will automatically convert numbers, arrays, and objects into strings so they can be inserted into a filemaker field. The create method will automatically create a `fieldData` property and add all data to that property if there is no fieldData property present. The client will preserve the contents of the `portalData` property.

`client.create(layout, data, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| layout | <code>String</code> | The layout to use when creating a record. |
| data | <code>Object</code> | The data to use when creating a record. |
| parameters | <code>Object</code> | The request parameters to use when creating the record. |



Result:


Both the create method and the edit method accept a merge boolean in their option parameters. If the `merge` property is true the data used to create or edit the filemaker record will be merged with the FileMaker Data API results.


Result:


The create method also allows you to trigger scripts when creating a record. Notice the scripts property in the following example. You can specify scripts to run using either FileMaker's script.key syntax or specify an array of in a `scripts` property. The script objects should have with `name`, optional `phase`, and optional  `params` parameters. For more information see the scripts syntax example in the introduction.


Result:


### Get Record Details

The Get method will return a specific FileMaker record based on the recordId passed to it. The recordId can be a string or a number.

`client.get(layout, recordId, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| layout | <code>String</code> | The layout to use when retrieving the record. |
| recordId | <code>String</code> | The FileMaker internal record ID to use when retrieving the record. |
| parameters | <code>Object</code> | Parameters to add for the get query. |



Result:



### List Records

You can use the client to list filemaker records. The list method accepts a layout and parameter variable. The client will automatically santize the limit, offset, and sort keys to correspond with the DAPI's requirements.

`client.list(layout, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| layout | <code>String</code> | The layout to use when retrieving the record. |
| parameters | <code>Object</code> | the parameters to use to modify the query. |



Result:



### Find Records

The client's find method will accept either a single object as find parameters or an array. The find method will also santize the limit, sort, and offset parameters to conform with the Data API's requirements.

`client.find(layout, query, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| layout | <code>String</code> | The layout to use when performing the find. |
| query | <code>Object</code> | to use in the find request. |
| parameters | <code>Object</code> | the parameters to use to modify the query. |



Result:


### Edit Records

The client's edit method requires a layout, recordId, and object to use for updating the record.

`client.edit(layout, recordId, data, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| layout | <code>String</code> | The layout to use when editing the record. |
| recordId | <code>String</code> | The FileMaker internal record ID to use when editing the record. |
| data | <code>Object</code> | The data to use when editing a record. |
| parameters | <code>Object</code> | parameters to use when performing the query. |



Result:


### Delete Records

The client's delete method requires a layout and a record id. The recordId can be a number or a string.

`client.delete(layout, recordId, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| layout | <code>String</code> | The layout to use when deleting the record. |
| recordId | <code>String</code> | The FileMaker internal record ID to use when editing the record. |



Result:


### Trigger Script

The client's script method will trigger a script. You can also trigger scripts with the create, edit, list, find, and delete methods. This method performs a list with a limit of one on the specified layout before triggering the script. this is the most lightweight request possible while still being able to trigger a script.

`client.script(layout, script, param, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| layout | <code>String</code> | The layout to use for the list request |
| name | <code>String</code> | The name of the script |
| parameters | <code>Object</code> | Parameters to pass to the script |



Result:


### Upload Files

The upload method will upload binary data to a container. The file parameter should be either a path to a file or a buffer. If you need to set a field repetition, you can set that in parameters. If recordId is 0 or undefined a new record will be created.

`client.upload(file, layout, container, recordId, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| file | <code>String</code> | The path to the file to upload. |
| layout | <code>String</code> | The layout to use when performing the find. |
| containerFieldName | <code>String</code> | The field name to insert the data into. It must be a container field. |
| recordId | <code>Number</code> \| <code>String</code> | the recordId to use when uploading the file. |
| fieldRepetition | <code>Number</code> | The field repetition to use when inserting into a container field. by default this is 1. |



Result:


You can also provide a record Id to the upload method and the file will be uploaded to that
record.



Result:


### Set Session Globals

The globals method will set global fields for the current session.

`client.globals(data, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> \| <code>Array</code> | a json object containing the name value pairs to set. |



Result:


### Utility Methods

The client also provides utility methods to aid in parsing and manipulating FileMaker Data. The client exports the `recordId(data)`, `fieldData(data)`, and `transform(data, options)` to aid in transforming Data API response data into other formats. Each utility method is capable of recieving either an object or a array.

#### recordId Method

The recordId method retrieves the `recordId` properties for a response. This method will return either a single string or an array of strings.

`recordId(data)`


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> \| <code>Array</code> | the raw data returned from a filemaker. This can be an array or an object. |



Result:


#### fieldData Method

The fieldData method retrieves the `fieldData`, `recordId`, and `modId` properties from a Data API response. The fieldData method will merge the `recordId` and `modId` properties into fielData properties. This method will not convert `table::field` properties.

`fieldData(data)`


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> \| <code>Array</code> | The raw data returned from a filemaker. This can be an array or an object. |



Result:


#### Transform Utility

The transform utility converts Data API response data by converting `table::field` properties to objects. This method will transverse the response data and converting `{ table::field : value}` properties to `{ table:{ field : value } }`. The transform utility will also convert `portalData` into arrays of objects. 

The transform utility accepts three option properties. The three option properties are all booleans and true by default. The three option properties are `convert`,`fieldData`,`portalData`. The `convert` property controls the transfomation of `table::field` properties. The `fieldData` property controls the merging of fieldData to the result. The `portalData` property controls the merging of portalData to the result. Setting any propery to false its transformation off. 

`transform(data, parameters)`


| Param | Type | Description |
| --- | --- | --- |
| object | <code>Object</code> | The response recieved from the FileMaker DAPI. |



Result:



#### ContainerData Utility

The containerData utility will retrieve FileMaker container data by following the links returned by the Data API. This utility will accept either a single data object or an array of objects. The utility will use the `field` parameter to target container data urls in the data parameter. This utility also requires a `name` parameter which will be used to target a data property that should be used as the file's name. If a name parameter is provided that is not a property or nested property in the `data` parameter, the name parameter itself will be used. The `destination` parameter should be either 'buffer' to indicate that an object with a file's name and buffer should be returned or the path, relative to the current working directory, where the utility should write container data to a file. This utility will also accept optional request `parameters` to modify the http request.

`container(data, field, name, destination, parameters)` 


| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> \| <code>Array</code> | The response recieved from the FileMaker DAPI. |
| field | <code>String</code> | The container field name to target. This can be a nested property. |
| name | <code>String</code> | The field to use for the file name or a static string. |
| destination | <code>String</code> | "buffer" if a buffer object should be returned or the path to write the file. |
| [parameters] | <code>Object</code> | request parameters. |
| [parameters.timeout] | <code>Number</code> | a timeout for the request. |



Result:


## Custom Request Agents, Custom Request Parameters, and Proxies

The client has the ability to create custom agents and modify requests parameters or use a proxy. Agents, request parameters, and proxies can be configured either when the client is created or when a request is being made.

### Custom Request Agents

A client can have a custom [Agent](https://nodejs.org/api/http.html#http_class_http_agent). Using a custom request agent will allow you to configure an agent designed for your specific needs. A request agent can be configured to not reject unauthorized request such as those with invalid SSLs, keep the connection alive, or limit the number of sockets to a host. There is no need to create an agent unless theses options are needed.

**Note** If you are using a custom agent you are responsible for destroying that agent with `client.destroy` once the agent is no longer used.

### Custom Request Parameters

All client methods except `client.login()` and `client.logout()` accept request parameters. These parameters are `request.proxy` and `request.timeout`, `request.agent`. These properties will apply only to the current request. 

### Proxies

The client can be configured to use a proxy. The proxy can be configured either for every request by specifying the proxy during the creation of the client, or just for a particular request by specifying the proxy in the request parameters.

## Tests

```sh
npm install
npm test
```







