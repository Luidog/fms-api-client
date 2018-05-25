'use strict';

const axios = require('axios');
const _ = require('lodash');
const fs = require('fs');
const FormData = require('form-data');
const { Document } = require('marpat');
const { Connection } = require('./connection.model');
const { Credentials } = require('./credentials.model');
const { Data } = require('./data.model');

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
   * @method _sanitizeParameters
   * @memberof Client
   * @private
   * @description stringifys all values for an object. This is used to ensure that find requests and list requests
   * can use either strings or numbers when setting options.
   * @return {Object} returns an object with all values mapped to strings.
   */
  _sanitizeParameters(parameters) {
    return _.mapValues(
      parameters,
      value => (_.isNumber(value) ? value.toString() : value)
    );
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
          .then(token => {
            this.save();
            return token;
          })
          .then(token => resolve(token))
          .catch(error => reject(error));
      }
    });
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
  create(layout, data, parameters = {}) {
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
            data: Object.assign(parameters, {
              fieldData: this._stringify(data)
            })
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => this._filterResponse(body))
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
            data: Object.assign(this._sanitizeParameters(parameters), {
              fieldData: this._stringify(data)
            })
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => this._filterResponse(body))
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
            data: this._sanitizeParameters(parameters) || {}
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => this._filterResponse(body))
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
            params: this._namespace(parameters)
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => this._filterResponse(body))
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
            params: this._namespace(parameters)
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => this._filterResponse(body))
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
              { query: this._toArray(query) },
              this._sanitizeParameters(parameters)
            )
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(body => this._filterResponse(body))
        .then(response => resolve(response))
        .catch(
          error =>
            error.response.data.messages[0].code === '401'
              ? resolve({
                  data: [],
                  message: this._filterResponse(error.response.data)
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
  upload(file, layout, containerFieldName, recordId = 0, fieldRepetition = 1) {
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
        .then(body => this._filterResponse(body))
        .then(response => resolve(response))
        .catch(
          error =>
            error.errno !== undefined
              ? reject(error.message)
              : reject(error.response.data.messages[0])
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
            params: this._sanitizeParameters(
              Object.assign(
                { script: name, 'script.param': this._stringify(parameters) },
                this._namespace({ limit: '1' })
              )
            )
          })
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this.connection.extend(body))
        .then(body => this._saveState(body))
        .then(
          body =>
            body.response.scriptError === '0'
              ? resolve({
                  result: this._isJson(body.response.scriptResult)
                    ? JSON.parse(body.response.scriptResult)
                    : body.response.scriptResult
                })
              : reject({
                  result: this._isJson(body.response.scriptResult)
                    ? JSON.parse(body.response.scriptResult)
                    : body.response.scriptResult
                })
        )
        .catch(error => reject(error.response.data.messages[0]))
    );
  }

  /**
  /**
   * @method _toArray
   * @private
   * @memberof Client
   * @description _toArray is a helper method that converts an object into an array. This is used 
   * @param  {Object|Array} data the raw data returned from a filemaker. This can be an array or an object.
   * @return {Object}      a json object containing stringified data.
   */
  _toArray(data) {
    return Array.isArray(data) ? data : [data];
  }
  /**
   * @method _stringify
   * @private
   * @memberof Client
   * @description _stringify is a helper method that converts numbers and objects / arrays to strings.
   * @param  {Object|Array} The data being used to create or update a record.
   * @return {Object}      a json object containing stringified data.
   */
  _stringify(data) {
    return _.mapValues(
      this.data.incoming(data),
      value =>
        typeof value === 'string'
          ? value
          : typeof value === 'object'
            ? JSON.stringify(value)
            : typeof value === 'number' ? value.toString() : ''
    );
  }
  /**
   * @method _filterResponse
   * @private
   * @memberof Client
   * @description This method filters the FileMaker DAPI response by testing if a script was triggered with
   * the request, then either selecting the response, script error, and script result from the response or
   * selecting just the response.
   * @return {Object}      a json object containing the selected data from the Data API Response.
   */
  _filterResponse(data) {
    return data.scriptError
      ? _.chain(data)
          .map(object =>
            _.pick(object, ['response', 'scriptError', 'scriptResult'])
          )
          .mapValues(value => (this._isJson(value) ? JSON.parse(value) : value))
      : _.mapValues(
          data.response,
          value => (this._isJson(value) ? JSON.parse(value) : value)
        );
  }
  /**
   * @method _isJson
   * @private
   * @memberof Client
   * @description This is a helper method for the _filterResponse method.
   * @return {Boolean}      a boolean result if the data passed to it is json
   */
  _isJson(data) {
    try {
      JSON.parse(data);
    } catch (e) {
      return false;
    }
    return true;
  }
  /**
   * @method _namespace
   * @private
   * @memberof Client
   * @description This method filters the FileMaker DAPI response by testing if a script was triggered with
   * the request, then either selecting the response, script error, and script result from the response or
   * selecting just the response.
   * @return {Object}      a json object containing the selected data from the Data API Response.
   */
  _namespace(data) {
    let underscored = ['limit', 'offset', 'sort'];

    return _.mapKeys(
      data,
      (value, key) => (_.includes(underscored, key) ? `_${key}` : key)
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
      ? _.map(data, object =>
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
      ? _.map(data, object => object.recordId)
      : data.recordId.toString();
  }
}
/**
 * @module Client
 */
module.exports = {
  Client
};
