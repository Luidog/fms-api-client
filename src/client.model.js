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
  stringify,
  sanitizeParameters,
  parseScriptResult,
  setData
} = require('./utilities');

/**
 * @class Client
 * @classdesc The class used to integrate with the FileMaker server Data API
 */
class Client extends Document {
  constructor() {
    super();
    this.schema({
      /**
       * The version of Data API to use.
       * @member Client#version
       * @type String
       */
      version: {
        type: String,
        required: true,
        default: '1'
      },
      /**
       * The client application name.
       * @member Client#application
       * @type String
       */
      application: {
        type: String,
        required: true
      },
      /**
       * A name for the client.
       * @member Client#name
       * @type String
       */
      name: {
        type: String
      },
      /**
       * The client application server.
       * @member Client#server
       * @type String
       */

      server: {
        type: String,
        validate: data =>
          data.startsWith('http://') || data.startsWith('https://'),
        required: true
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

  destroy() {
    return super.delete();
  }
  /**
   * @method _createURL
   * @memberof Client
   * @private
   * @description Generates a url for use when creating a record.
   * @param {String} layout The layout to use when creating a record.
   * @return {String} A URL to use when creating records.
   */
  _createURL(layout) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records`;
    return url;
  }
  /**
   * @method _updateURL
   * @memberof Client
   * @private
   * @description Generates a url for use when updating a record.
   * @param {String} layout The layout to use when updating a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL to use when updating records.
   */
  _updateURL(layout, recordId) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records/${recordId}`;
    return url;
  }
  /**
   * @method _deleteURL
   * @memberof Client
   * @private
   * @description Generates a url for use when deleting a record.
   * @param {String} layout The layout to use when creating a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL to use when deleting records.
   */
  _deleteURL(layout, recordId) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records/${recordId}`;
    return url;
  }
  /**
   * @method _getURL
   * @private
   * @memberOf Client
   * @description Generates a url to access a record.
   * @param {String} layout The layout to use when acessing a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL to used when getting one record.
   */
  _getURL(layout, recordId) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records/${recordId}`;
    return url;
  }
  /**
   * @method _listURL
   * @private
   * @memberOf Client
   * @descriptionGenerates a url for use when listing records.
   * @param {String} layout The layout to use when listing records.
   * @return {String} A URL to use when listing records.
   */
  _listURL(layout) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records`;
    return url;
  }
  /**
   * @method _findURL
   * @private
   * @memberOf Client
   * @description Generates a url for use when performing a find request.
   * @param {String} layout The layout to use when listing records.
   * @return {String} A URL to use when performing a find.
   */
  _findURL(layout) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/_find`;
    return url;
  }
  /**
   * @method _globalsURL
   * @private
   * @memberOf Client
   * @description Generates a url for use when setting globals. Like FileMaker
   * globals, these values will only be set for the current session.
   * @param {String} layout The layout to use when setting globals.
   * @return {String} A URL to use when setting globals
   */
  _globalsURL() {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/globals`;
    return url;
  }
  /**
   * @method _logoutURL
   * @memberof Client
   * @private
   * @description Generates a url for use when logging out of a FileMaker Session.
   * @return {String} A URL to use when logging out of a FileMaker DAPI session.
   */
  _logoutURL(token) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/sessions/${token}`;
    return url;
  }
  /**
   * @method _uploadURL
   * @memberOf Client
   * @description Generates a url for use when uploading files to FileMaker containers.
   * @private
   * @param {String} layout The layout to use when setting globals.
   * @param {String} recordId the record id to use when inserting the file.
   * @param {String} fieldName the field to use when inserting a file.
   * @param {String} fieldRepetition The repetition to use when inserting the file.
   * default is 1.
   * @return {String} A URL to use when uploading files to FileMaker.
   */
  _uploadURL(layout, recordId, fieldName, fieldRepetition = 1) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records/${recordId}/containers/${fieldName}/${fieldRepetition}`;
    return url;
  }

  /**
   * @method _authURL
   * @memberof Client
   * @private
   * @description Generates a url for use when retrieving authentication tokens
   * in exchange for Account credentials.
   * @return {String} A URL to use when authenticating a FileMaker DAPI session.
   */
  _authURL() {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/sessions`;
    return url;
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
          .generate(this.agent, this._authURL())
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
   * @method logout
   * @memberof Client
   * @public
   * @description logs out of the current authentication session and clears the saved token.
   * @see {@method Connnection#clear}
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  logout() {
    return new Promise(
      (resolve, reject) =>
        this.connection.valid()
          ? this.agent
              .request({
                url: this._logoutURL(this.connection.token),
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
    if (error.expired) {
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
              url: this._createURL(layout),
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
        .then(
          response =>
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
              url: this._updateURL(layout, recordId),
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
        .then(
          body =>
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
              url: this._deleteURL(layout, recordId),
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
              url: this._getURL(layout, recordId),
              method: 'get',
              headers: {
                Authorization: `Bearer ${token}`
              },
              params: stringify(
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
              url: this._listURL(layout),
              method: 'get',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              params: stringify(
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
              url: this._findURL(layout),
              method: 'post',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: Object.assign(
                { query: toArray(query) },
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
        .catch(
          error =>
            error.code === '401'
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
              url: this._globalsURL(),
              method: 'patch',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: { globalFields: JSON.stringify(data) }
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

      if (!Buffer.isBuffer(file)) {
        stream = fs.createReadStream(file);
        stream.on('error', error =>
          reject({ message: error.message, code: error.code })
        );
      } else {
        stream = intoStream(file);
        stream.name = 'upload-stream';
      }

      form.append('upload', stream);

      resolveRecordId()
        .then(resolvedId =>
          this.authenticate()
            .then(token =>
              this.agent.request(
                {
                  url: this._uploadURL(
                    layout,
                    resolvedId,
                    containerFieldName,
                    parameters.fieldRepetition
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
              url: this._listURL(layout),
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
                      ? stringify(param)
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
