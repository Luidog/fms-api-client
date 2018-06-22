'use strict';

const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { Document } = require('marpat');
const { Connection } = require('./connection.model');
const { Data } = require('./data.model');
const {
  toArray,
  namespace,
  isJson,
  stringify,
  map,
  sanitizeParameters,
  filterResponse
} = require('./utilities.service');

/**
 * @class Client
 * @classdesc The class used to integrate with the FileMaker server Data API
 */
class Client extends Document {
  constructor(data) {
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
       * The client application server.
       * @member Client#server
       * @type String
       */

      server: {
        type: String,
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
      }
    });
  }
  /**
   * preInit is a hook
   * @schema
   * @return {null} The preInit hook does not return anything
   */
  preInit(data) {
    this.data = Data.create();
    this.connection = Connection.create({
      server: data.server,
      application: data.application,
      user: data.user,
      password: data.password
    });
  }
  /**
   * Generates a url for use when creating a record.
   * @private
   * @param {String} layout The layout to use when creating a record.
   * @return {String} A URL
   */
  _createURL(layout) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records`;
    return url;
  }
  /**
   * Generates a url for use when updating a record.
   * @private
   * @param {String} layout The layout to use when updating a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL
   */
  _updateURL(layout, recordId) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records/${recordId}`;
    return url;
  }
  /**
   * Generates a url for use when deleting a record.
   * @private
   * @param {String} layout The layout to use when creating a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL
   */
  _deleteURL(layout, recordId) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records/${recordId}`;
    return url;
  }

  /**
   * Generates a url to access a record.
   * @private
   * @param {String} layout The layout to use when acessing a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL
   */
  _getURL(layout, recordId) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records/${recordId}`;
    return url;
  }
  /**
   * Generates a url for use when listing records.
   * @private
   * @param {String} layout The layout to use when listing records.
   * @return {String} A URL
   */
  _listURL(layout) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records`;
    return url;
  }
  /**
   * Generates a url for use when performing a find request.
   * @private
   * @param {String} layout The layout to use when listing records.
   * @return {String} A URL
   */
  _findURL(layout) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/_find`;
    return url;
  }
  /**
   * Generates a url for use when setting globals.
   * @private
   * @param {String} layout The layout to use when setting globals.
   * @return {String} A URL
   */
  _globalsURL() {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/globals`;
    return url;
  }
  /**
   * @method _logoutURL
   * @memberof Connection
   * @private
   * @description Generates a url for use when logging out of a FileMaker Session.
   * @return {String} A URL
   */
  _logoutURL(token) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/sessions/${token}`;
    return url;
  }
  /**
   * Generates a url for use when uploading files to FileMaker containers.
   * @private
   * @param {String} layout The layout to use when setting globals.
   * @param {String} recordId the record id to use when inserting the file.
   * @param {String} fieldName the field to use when inserting a file.
   * @param {String} fieldRepetition The repetition to use when inserting the file.
   * default is 1.
   * @return {String} A URL
   */
  _uploadURL(layout, recordId, fieldName, fieldRepetition = 1) {
    let url = `${this.server}/fmi/data/v1/databases/${
      this.application
    }/layouts/${layout}/records/${recordId}/containers/${fieldName}/${fieldRepetition}`;
    return url;
  }

  /**
   * @method authenticate
   * @memberof Client
   * @public
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
          .generate()
          .then(body => this._saveState(body))
          .then(body => this.data.outgoing(body))
          .then(body => resolve(body.response.token))
          .catch(error => reject(error));
      }
    });
  }
  /**
   * @method logout
   * @memberof Client
   * @public
   * @description logs out of the current authentication session and removes the saved token.
   * @see {@method Connnection#remove}
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  logout() {
    return new Promise(
      (resolve, reject) =>
        this.connection.valid()
          ? axios({
              url: this._logoutURL(this.connection.token),
              method: 'delete',
              data: {}
            })
              .then(response => response.data)
              .then(body => this.data.outgoing(body))
              .then(body => this.connection.remove(body))
              .then(body => this._saveState(body))
              .then(body => resolve(body.messages[0]))
              .catch(error => reject(error.response.data.messages[0]))
          : reject({ message: 'No session to log out.' })
    );
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
          axios({
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
                'script.presort.param'
              ]),
              {
                fieldData: this.data.incoming(stringify(data))
              }
            )
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => filterResponse(body))
        .then(
          response =>
            parameters.merge ? Object.assign(data, response) : response
        )
        .then(response => resolve(response))
        .catch(error => reject(error.response.data.messages[0]))
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
          axios({
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
                'script.presort.param'
              ]),
              {
                fieldData: this.data.incoming(stringify(data))
              }
            )
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => filterResponse(body))
        .then(response => resolve(response))
        .catch(error => reject(error.response.data.messages[0]))
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
          axios({
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
              'script.presort.param'
            ])
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => filterResponse(body))
        .then(response => resolve(response))
        .catch(error => reject(error.response.data.messages[0]))
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
          axios({
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
                '_limit.*'
              ])
            )
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => filterResponse(body))
        .then(response => resolve(response))
        .catch(error => reject(error.response.data.messages[0]))
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
          axios({
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
                '_limit.*'
              ])
            )
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => filterResponse(body))
        .then(response => resolve(response))
        .catch(error => reject(error.response.data.messages[0]))
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
          axios({
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
                'limit.*'
              ])
            )
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => filterResponse(body))
        .then(response => resolve(response))
        .catch(
          error =>
            error.response.data.messages[0].code === '401'
              ? resolve({
                  data: [],
                  message: filterResponse(error.response.data)
                })
              : reject(error.response.data.messages[0])
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
  globals(data) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          axios({
            url: this._globalsURL(),
            method: 'patch',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: { globalFields: JSON.stringify(data) }
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => resolve(body.response))
        .catch(error => reject(error.response.data.messages[0]))
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
  upload(file, layout, containerFieldName, recordId = 0, fieldRepetition) {
    return new Promise((resolve, reject) => {
      let form = new FormData();
      let resolveRecordId = () =>
        recordId === 0
          ? this.create(layout, {}).then(response => response.recordId)
          : Promise.resolve(recordId);

      form.append('upload', fs.createReadStream(file));

      resolveRecordId()
        .then(recordId =>
          this.authenticate().then(token =>
            axios.post(
              this._uploadURL(
                layout,
                recordId,
                containerFieldName,
                fieldRepetition
              ),
              form,
              {
                headers: {
                  ...form.getHeaders(),
                  Authorization: `Bearer ${token}`
                }
              }
            )
          )
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => filterResponse(body))
        .then(response => resolve(response))
        .catch(
          error =>
            error.errno === undefined
              ? reject(error.response.data.messages[0])
              : reject(error.message)
        );
    });
  }
  /**
   * @method script
   * @public
   * @memberof Client
   * @description A public method to make triggering a script easier. This method uses the list method with
   * a limit of 1. This is the lightest weight query possible while still allowing for a script to be triggered.
   * For a more robust query with scripts use the find method.
   * @param  {String} name       The name of the script
   * @param  {String} layout     The layout to use for the list request
   * @param  {Object} parameters Parameters to pass to the script
   * @return {Promise}           returns a promise that will either resolve or reject based on the Data API.
   */
  script(name, layout, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          axios({
            url: this._listURL(layout),
            method: 'get',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            params: sanitizeParameters(
              Object.assign(
                { script: name, 'script.param': stringify(parameters) },
                namespace({ limit: 1 })
              )
            )
          })
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
        .catch(error => reject(error.response.data.messages[0]))
    );
  }
  /**
   * @method fieldData
   * @public
   * @memberof Client
   * @description fieldData is a helper method that strips the filemaker structural layout and portal information
   * from a record. It returns only the data contained in the fieldData key and the recordId.
   * @param  {Object|Array} data the raw data returned from a filemaker. This can be an array or an object.
   * @return {Object}      a json object containing fieldData from the record.
   */
  fieldData(data) {
    return Array.isArray(data)
      ? map(data, object =>
          Object.assign({}, object.fieldData, {
            recordId: object.recordId,
            modId: object.modId
          })
        )
      : Object.assign(data.fieldData, {
          recordId: data.recordId,
          modId: data.modId
        });
  }
  /**
   * @method recordId
   * @public
   * @memberof Client
   * @description returns record ids for the data parameters passed to it. This can be an array of ids or an object.
   * from a record. It returns only the data contained in the fieldData key adn the recordId.
   * @param  {Object|Array} data the raw data returned from a filemaker. This can be an array or an object.
   * @return {Object}      a json object containing fieldData from the record.
   */
  recordId(data) {
    return Array.isArray(data)
      ? map(data, object => object.recordId)
      : data.recordId.toString();
  }
}
/**
 * @module Client
 */
module.exports = {
  Client
};
