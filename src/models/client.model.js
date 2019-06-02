'use strict';

const fs = require('fs');
const { Document } = require('marpat');
const FormData = require('form-data');
const intoStream = require('into-stream');
const { Connection } = require('./connection.model');
const { Data } = require('./data.model');
const { Agent } = require('./agent.model.js');
const {
  toArray,
  namespace,
  isJson,
  toStrings,
  sanitizeParameters,
  parseScriptResult,
  setData,
  urls
} = require('../utilities');

const { productInfo, databases } = require('../services');

/**
 * @global FMS_API_CLIENT
 */

global.FMS_API_CLIENT = {};

/**
 * @class Client
 * @classdesc The class used to integrate with the FileMaker server Data API
 */

class Client extends Document {
  constructor() {
    super();
    this.schema({
      /**
       * A name for the client.
       * @member Client#name
       * @type String
       */
      name: {
        type: String
      },
      /**
       * The client FileMaker Server.
       * @member Client#server
       * @type String
       */
      server: {
        type: String,
        validate: data =>
          data.startsWith('http://') || data.startsWith('https://'),
        required: true
      },
      /**
       * The client database name.
       * @member Client#database
       * @type String
       */
      database: {
        type: String,
        required: true
      },
      /**
       * The version of Data API to use.
       * @member Client#version
       * @type String
       */
      version: {
        type: String,
        required: true,
        default: 'vLatest'
      },
      /** The client data logger.
       * @public
       * @member Client#data
       * @type Object
       */
      data: {
        type: Data,
        required: true
      },
      /** The client application connection object.
       * @public
       * @member Client#connection
       * @type Object
       */
      connection: {
        type: Connection,
        required: true
      },
      /** The client agent object.
       * @public
       * @member Client#agent
       * @type Object
       */
      agent: {
        type: Agent,
        required: true
      }
    });
  }
  /**
   * preInit is a hook
   * @schema
   * @description The client preInit hook  creates a data embedded document and a connection
   * embedded document on create.
   * @param {Object} data The data used to create the client.
   * @return {null} The preInit hook does not return anything.
   */
  preInit(data) {
    let { agent, timeout, usage, proxy, ...connection } = data;
    let protocol = data.server.startsWith('https') ? 'https' : 'http';
    this.data = Data.create({ track: usage === undefined });
    this.connection = Connection.create(connection);
    this.agent = Agent.create({ agent, proxy, timeout, protocol });
  }

  /**
   * preDelete is a hook
   * @schema
   * @description The client delete hook ensures a client attempts to log out before it is destroyed.
   * @param {Object} data The data used to create the client.
   * @return {null} The delete hook does not return anything.
   */

  preDelete() {
    return new Promise((resolve, reject) =>
      this.logout()
        .then(response => resolve(response))
        .catch(error => resolve(error))
    );
  }

  /**
   * @method destroy
   * @memberof Client
   * @public
   * @description The destroy method is tied to the base model's
   * delete method method. This allows you to delete a client.
   * @return {null} The delete method does not return anything.
   */

  destroy() {
    return super.delete();
  }

  /**
   * @method authenticate
   * @memberof Client
   * @private
   * @description Checks the private connection schema for a token and if the current time is between when that token was
   * issued and when it will expire. If the connection token is not a string (its empty) or the current time is
   * not between when the token is issued and the time it will expire this method calls the private
   * is returned this promise method will reject.
   * @see {@method Connnection#generate}
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  authenticate() {
    return new Promise((resolve, reject) => {
      if (this.connection.valid()) {
        resolve(this.connection.token);
      } else {
        this.connection
          .generate(
            this.agent,
            urls.authentication(this.server, this.database, this.version)
          )
          .then(body => this._saveState(body))
          .then(body => this.data.outgoing(body))
          .then(body => resolve(body.response.token))
          .catch(error => reject(error));
      }
    });
  }

  /**
   * @method login
   * @memberof Client
   * @public
   * @description creates a session with the Data API and returns a token.
   * @see {@method Client#authenticate}
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  login() {
    return this.authenticate().then(token => ({
      token
    }));
  }
  /**
   * @method productInfo
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server or FileMaker Cloud host.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  productInfo() {
    return new Promise((resolve, reject) =>
      productInfo(this.server, this.version)
        .then(response => resolve(response))
        .catch(error => reject(error))
    );
  }

  /**
   * @method databases
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  databases() {
    return databases(this.server, this.credentials, this.version);
  }

  /**
   * @method layouts
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  layouts(parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.layouts(this.server, this.database, this.version),
              method: 'get',
              headers: {
                Authorization: `Bearer ${token}`
              }
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => parseScriptResult(body))
        .then(response => resolve(response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method scripts
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  scripts(parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.scripts(this.server, this.database, this.version),
              method: 'get',
              headers: {
                Authorization: `Bearer ${token}`
              }
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => resolve(body.response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method layout
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  layout(layout, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.layout(
                this.server,
                this.database,
                layout,
                this.version
              ),
              method: 'get',
              params: toStrings(sanitizeParameters(parameters, ['recordId'])),
              headers: {
                Authorization: `Bearer ${token}`
              }
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => resolve(body.response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method duplicate
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  duplicate(layout, recordId, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.duplicate(
                this.server,
                this.database,
                layout,
                recordId,
                this.version
              ),
              method: 'post',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              data: sanitizeParameters(parameters, [
                'script',
                'script.param',
                'script.prerequest',
                'script.prerequest.param',
                'script.presort',
                'script.presort.param',
                'request'
              ])
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => parseScriptResult(body))
        .then(response => resolve(response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method logout
   * @memberof Client
   * @public
   * @description logs out of the current authentication session and clears the saved token.
   * @see {@method Connnection#clear}
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  logout() {
    return new Promise((resolve, reject) =>
      this.connection.valid()
        ? this.agent
            .request({
              url: urls.logout(
                this.server,
                this.database,
                this.connection.token,
                this.version
              ),
              method: 'delete',
              data: {}
            })
            .then(response => response.data)
            .then(body => this.data.outgoing(body))
            .then(body => this.connection.clear(body))
            .then(body => this._saveState(body))
            .then(body => resolve(body.messages[0]))
            .catch(error => reject(this._checkToken(error)))
        : reject({ message: 'No session to log out.' })
    );
  }

  /**
   * @method _checkToken
   * @private
   * @description The _checkToken method will check the error based to it
   * for an expired property and if found will delete that property, clear
   * the current token and save the client. This method is used to discard
   * tokens which have been invalidated before their 15 minute expiration
   * lifespan is exceed.
   * @param {Object} error The layout to use when acessing a record.
   * @return {Object} The error object with the expired key removed
   */

  _checkToken(error) {
    if (
      error.expired ||
      error.message === 'Invalid FileMaker Data API token (*)'
    ) {
      delete error.expired;
      this.connection.clear();
      this.save();
    }
    return error;
  }

  /**
   * @method saveState
   * @private
   * @memberof Client
   * @description Triggers a save and returns the response. This is responsible for ensuring the documents are up to date.
   * @param {Any} response The response data from the data api request.
   * @return {Any} Returns the umodified response.
   *
   */

  _saveState(response) {
    this.save();
    return response;
  }

  /**
   * @method create
   * @public
   * @memberof Client
   * @description Creates a record in FileMaker. This method accepts a layout variable and a data variable.
   * @param {String} layout The layout to use when creating a record.
   * @param {Object} data The data to use when creating a record.
   * @param {Object} parameters The request parameters to use when creating the record.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  create(layout, data = {}, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.create(
                this.server,
                this.database,
                layout,
                this.version
              ),
              method: 'post',
              headers: {
                authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: Object.assign(
                sanitizeParameters(parameters, [
                  'portalData',
                  'script',
                  'script.param',
                  'script.prerequest',
                  'script.prerequest.param',
                  'script.presort',
                  'script.presort.param',
                  'request'
                ]),
                this.data.incoming(setData(data))
              )
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => parseScriptResult(body))
        .then(response =>
          parameters.merge ? Object.assign(data, response) : response
        )
        .then(response => resolve(response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method edit
   * @public
   * @memberof Client
   * @description Edits a filemaker record.
   * @param {String} layout The layout to use when editing the record.
   * @param {String} recordId The FileMaker internal record ID to use when editing the record.
   * @param {Object} data The data to use when editing a record.
   * @param {Object} parameters parameters to use when performing the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  edit(layout, recordId, data, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.update(
                this.server,
                this.database,
                layout,
                recordId,
                this.version
              ),
              method: 'patch',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: Object.assign(
                sanitizeParameters(parameters, [
                  'portalData',
                  'modId',
                  'script',
                  'script.param',
                  'script.prerequest',
                  'script.prerequest.param',
                  'script.presort',
                  'script.presort.param',
                  'request'
                ]),
                this.data.incoming(setData(data))
              )
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => parseScriptResult(body))
        .then(body =>
          parameters.merge
            ? Object.assign(data, { recordId: recordId }, body)
            : body
        )
        .then(response => resolve(response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method delete
   * @public
   * @memberof Client
   * @description Deletes a filemaker record.
   * @param {String} layout The layout to use when deleting the record.
   * @param {String} recordId The FileMaker internal record ID to use when editing the record.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  delete(layout, recordId, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.delete(
                this.server,
                this.database,
                layout,
                recordId,
                this.version
              ),
              method: 'delete',
              headers: {
                Authorization: `Bearer ${token}`
              },
              data: sanitizeParameters(parameters, [
                'script',
                'script.param',
                'script.prerequest',
                'script.prerequest.param',
                'script.presort',
                'script.presort.param',
                'request'
              ])
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => parseScriptResult(body))
        .then(response => resolve(response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method get
   * @public
   * @memberof Client
   * @description Retrieves a filemaker record based upon the layout and recordId.
   * @param {String} layout The layout to use when retrieving the record.
   * @param {String} recordId The FileMaker internal record ID to use when retrieving the record.
   * @param {Object} parameters Parameters to add for the get query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  get(layout, recordId, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.get(
                this.server,
                this.database,
                layout,
                recordId,
                this.version
              ),
              method: 'get',
              headers: {
                Authorization: `Bearer ${token}`
              },
              params: toStrings(
                sanitizeParameters(namespace(parameters), [
                  'script',
                  'script.param',
                  'script.prerequest',
                  'script.prerequest.param',
                  'script.presort',
                  'script.presort.param',
                  'layout.response',
                  'portal',
                  '_offset.*',
                  '_limit.*',
                  'request'
                ])
              )
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => parseScriptResult(body))
        .then(response => resolve(response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method list
   * @public
   * @memberof Client
   * @description Retrieves a list of FileMaker records based upon a layout.
   * @param {String} layout The layout to use when retrieving the record.
   * @param {Object} parameters the parameters to use to modify the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  list(layout, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.list(this.server, this.database, layout, this.version),
              method: 'get',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              params: toStrings(
                sanitizeParameters(namespace(parameters), [
                  '_limit',
                  '_offset',
                  '_sort',
                  'portal',
                  'script',
                  'script.param',
                  'script.prerequest',
                  'script.prerequest.param',
                  'script.presort',
                  'script.presort.param',
                  'layout.response',
                  '_offset.*',
                  '_limit.*',
                  'request'
                ])
              )
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => parseScriptResult(body))
        .then(response => resolve(response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method find
   * @public
   * @memberof Client
   * @description performs a FileMaker find.
   * @param {String} layout The layout to use when performing the find.
   * @param {Object} query to use in the find request.
   * @param {Object} parameters the parameters to use to modify the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */

  find(layout, query, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.find(this.server, this.database, layout, this.version),
              method: 'post',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: Object.assign(
                { query: toStrings(toArray(query)) },
                sanitizeParameters(parameters, [
                  'limit',
                  'sort',
                  'offset',
                  'portal',
                  'script',
                  'script.param',
                  'script.prerequest',
                  'script.prerequest.param',
                  'script.presort',
                  'script.presort.param',
                  'layout.response',
                  'offset.*',
                  'limit.*',
                  'request'
                ])
              )
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => parseScriptResult(body))
        .then(response => resolve(response))
        .catch(error =>
          error.code === '1630'
            ? resolve({
                data: [],
                message: 'No records match the request'
              })
            : reject(this._checkToken(error))
        )
    );
  }

  /**
   * @method globals
   * @public
   * @memberof Client
   * @description Sets global fields for the current session.
   * @param  {Object|Array} data a json object containing the name value pairs to set.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */

  globals(data, parameters) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.globals(this.server, this.database, this.version),
              method: 'patch',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: { globalFields: toStrings(data) }
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => resolve(body.response))
        .catch(error => reject(this._checkToken(error)))
    );
  }

  /**
   * @method upload
   * @public
   * @memberof Client
   * @description Allows you to upload a file to a FileMaker record container field. This method
   * currently creates a record for each upload. This method will use fs to read the file at the given
   * path to a stream. If a record Id is not passed to this method a new record will be created.
   * @param  {String} file               The path to the file to upload.
   * @param {String} layout The layout to use when performing the find.
   * @param  {String} containerFieldName The field name to insert the data into. It must be a container field.
   * @param  {Number|String} recordId the recordId to use when uploading the file.
   * @param  {Number} fieldRepetition    The field repetition to use when inserting into a container field.
   * by default this is 1.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */

  upload(file, layout, containerFieldName, recordId = 0, parameters = {}) {
    return new Promise((resolve, reject) => {
      let stream;
      let form = new FormData();
      let resolveRecordId = () =>
        recordId === 0
          ? this.create(layout, {}).then(response => response.recordId)
          : Promise.resolve(recordId);

      if (typeof file === 'string') {
        stream = fs.createReadStream(file);
        stream.on('error', error =>
          reject({ message: error.message, code: error.code })
        );
      } else if (!file || !file.name || !file.buffer) {
        reject({
          message: 'A file object must have a name and buffer property',
          code: 117
        });
      } else {
        stream = intoStream(file.buffer);
        stream.name = file.name;
      }

      form.append('upload', stream);

      resolveRecordId()
        .then(resolvedId =>
          this.authenticate()
            .then(token =>
              this.agent.request(
                {
                  url: urls.upload(
                    this.server,
                    this.database,
                    layout,
                    resolvedId,
                    containerFieldName,
                    parameters.fieldRepetition,
                    this.version
                  ),
                  method: 'post',
                  data: form,
                  headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${token}`
                  }
                },
                parameters
              )
            )
            .then(response => response.data)
            .then(body => this.data.outgoing(body))
            .then(body => this.connection.extend(body))
            .then(body => this._saveState(body))
            .then(body => parseScriptResult(body))
            .then(response => Object.assign(response, { recordId: resolvedId }))
        )
        .then(response => resolve(response))
        .catch(error => reject(this._checkToken(error)));
    });
  }

  /**
   * @method script
   * @public
   * @memberof Client
   * @description A public method to make triggering a script easier. This method uses the list method with
   * a limit of 1. This is the lightest weight query possible while still allowing for a script to be triggered.
   * For a more robust query with scripts use the find method.
   * @param  {String} layout     The layout to use for the list request
   * @param  {String} name       The name of the script
   * @param  {Object} parameters Parameters to pass to the script
   * @return {Promise}           returns a promise that will either resolve or reject based on the Data API.
   */

  script(layout, script, param = {}, parameters) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          this.agent.request(
            {
              url: urls.list(this.server, this.database, layout, this.version),
              method: 'get',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              params: sanitizeParameters(
                Object.assign(
                  {
                    script: script,
                    'script.param': isJson(param)
                      ? toStrings(param)
                      : param.toString()
                  },
                  namespace({ limit: 1 })
                )
              )
            },
            parameters
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body =>
          resolve({
            result: isJson(body.response.scriptResult)
              ? JSON.parse(body.response.scriptResult)
              : body.response.scriptResult
          })
        )
        .catch(error => reject(this._checkToken(error)))
    );
  }
}

module.exports = {
  Client
};
