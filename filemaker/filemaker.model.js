'use strict';

const moment = require('moment');
const request = require('request-promise');
const _ = require('lodash');

const { Document } = require('marpat');
const { Connection } = require('./connection.model');
const { Credentials } = require('./credentials.model');
/**
 * @class Filemaker
 * @classdesc The class used to integrate with the FileMaker server Data API
 */
class Filemaker extends Document {
  /**
   * FileMaker constructor.
   * @constructs Filemaker
   */
  constructor(data) {
    super();
    this.schema({
      /**
       * The version of Data API to use.
       * @member Filemaker#version
       * @type String
       */
      version: {
        type: String,
        required: true,
        default: 'beta'
      },
      /**
       * The client application name.
       * @member Filemaker#application
       * @type String
       */
      application: {
        type: String,
        required: true
      },
      /**
       * The client application server.
       * @member Filemaker#server
       * @type String
       */

      server: {
        type: String,
        required: true
      },
      /** The client application connection object.
       * @private
       * @member Filemaker#credentials
       * @type Object
       */
      credentials: Credentials,

      /** The client application connection object.
       * @public
       * @member Connection
       * @type Object
       */
      connection: Connection
    });
  }

  preInit(data) {
    this.credentials = Credentials.create({
      user: data.user,
      layout: data.layout,
      password: data.password
    });
    this.connection = Connection.create();
  }

  preSave() {
    if (typeof this.connection === 'undefined') {
      this.authenticate()
        .then(token => {
          this.connection.saveToken(token);
          this.save();
        })
        .catch(error => {
          console.log('Filemaker Authentication Error', { error: error });
        });
    }
  }
  /**
   * Generates a url for use when retrieving authentication tokens in exchange for Account credentials
   * @private
   * @return {String} A URL
   */
  _authURL() {
    let url = `${this.server}/fmi/rest/api/auth/${this.application}`;
    return url;
  }
  /**
   * Generates a url for use when creating a record.
   * @private
   * @param {String} layout The layout to use when creating a record.
   * @return {String} A URL
   */
  _createURL(layout) {
    let url = `${this.server}/fmi/rest/api/record/${
      this.application
    }/${layout}`;
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
    let url = `${this.server}/fmi/rest/api/record/${
      this.application
    }/${layout}/${recordId}`;
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
    let url = `${this.server}/fmi/rest/api/record/${
      this.application
    }/${layout}/${recordId}`;
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
    let url = `${this.server}/fmi/rest/api/record/${
      this.application
    }/${layout}/${recordId}`;
    return url;
  }
  /**
   * Generates a url for use when listing records.
   * @private
   * @param {String} layout The layout to use when listing records.
   * @return {String} A URL
   */
  _listURL(layout) {
    let url = `${this.server}/fmi/rest/api/record/${
      this.application
    }/${layout}`;
    return url;
  }
  /**
   * Generates a url for use when performing a find request.
   * @private
   * @param {String} layout The layout to use when listing records.
   * @return {String} A URL
   */
  _findURL(layout) {
    let url = `${this.server}/fmi/rest/api/find/${this.application}/${layout}`;
    return url;
  }
  /**
   * Generates a url for use when setting globals.
   * @private
   * @param {String} layout The layout to use when setting globals.
   * @return {String} A URL
   */
  _globalsURL() {
    let url = `${this.server}/fmi/rest/api/global/${this.application}/${
      this.credentials.layout
    }`;
    return url;
  }
  /**
   * @method _sanitizeParameters
   * @memberof Filemaker
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
   * @method _generateToken
   * @memberof Filemaker
   * @private
   * @description Retrieves an authentication token from the Data API. This promise method will check for
   * a zero errorCode before resolving. If an http error code or a non zero response error code.
   * is returned this promise method will reject
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   * response
   */
  _generateToken() {
    return new Promise((resolve, reject) => {
      request({
        url: this._authURL(),
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          user: this.credentials.user,
          password: this.credentials.password,
          layout: this.credentials.layout
        },
        json: true
      })
        .then(response => {
          if (response.errorCode === '0') {
            resolve(response.token);
          } else {
            reject(response.errorMessage);
          }
        })
        .catch(error => reject(error.message));
    });
  }

  /**
   * @method authenticate
   * @memberof Filemaker
   * @public
   * @description Checks the private connection schema for a token and if the current time is between when that token was
   * issued and when it will expire. If the connection token is not a string (its empty) or the current time is
   * not between when the token is issued and the time it will expire this method calls the private
   * is returned this promise method will reject.
   * @see {@method _generateToken}
   * @see {@method _saveToken}
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  authenticate() {
    return new Promise((resolve, reject) => {
      let currentTime = moment();

      if (
        typeof this.connection !== 'undefined' &&
        currentTime.isBetween(
          this.connection.issued,
          this.connection.expires,
          '()'
        )
      ) {
        resolve(this.connection.token);
      } else {
        this._generateToken()
          .then(token => this.connection.saveToken(token))
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
   * @method create
   * @public
   * @memberof Filemaker
   * @description Creates a record in FileMaker. This method accepts a layout variable and a data variable.
   * @param {String} layout The layout to use when creating a record.
   * @param {Object} data The data to use when creating a record.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  create(layout, data) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          request({
            url: this._createURL(layout),
            method: 'post',
            headers: {
              'FM-Data-token': `${this.connection.token}`,
              'Content-Type': 'application/json'
            },
            body: { data: data },
            json: true
          })
        )

        .then(response => this.connection.extend(response))

        .then(response => resolve(response))
        .catch(error => reject(error.message))
    );
  }
  /**
   * @method edit
   * @public
   * @memberof Filemaker
   * @description Edits a filemaker record.
   * @param {String} layout The layout to use when editing the record.
   * @param {String} recordId The FileMaker internal record ID to use when editing the record.
   * @param {Object} data The data to use when editing a record.
   * @param {Object} parameters parameters to use when performing the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  edit(layout, recordId, data, parameters) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          request({
            url: this._updateURL(layout, recordId),
            method: 'put',
            headers: {
              'FM-Data-token': `${this.connection.token}`,
              'Content-Type': 'application/json'
            },
            body: Object.assign(
              { data: data },
              this._sanitizeParameters(parameters)
            ),
            json: true
          })
        )
        .then(response => this.connection.extend(response))
        .then(response => resolve(response))
        .catch(response => reject(response.message))
    );
  }
  /**
   * @method delete
   * @public
   * @memberof Filemaker
   * @description Deletes a filemaker record.
   * @param {String} layout The layout to use when deleting the record.
   * @param {String} recordId The FileMaker internal record ID to use when editing the record.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  delete(layout, recordId) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          request({
            url: this._deleteURL(layout, recordId),
            method: 'delete',
            headers: {
              'FM-Data-token': `${this.connection.token}`
            },
            json: true
          })
        )
        .then(response => this.connection.extend(response))
        .then(response => resolve(response))
        .catch(response => reject(response.message))
    );
  }
  /**
   * @method get
   * @public
   * @memberof Filemaker
   * @description Retrieves a filemaker record based upon the layout and recordId.
   * @param {String} layout The layout to use when retrieving the record.
   * @param {String} recordId The FileMaker internal record ID to use when retrieving the record.
   * @param {Object} parameters Parameters to add for the get query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  get(layout, recordId, parameters) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          request({
            url: this._getURL(layout, recordId),
            method: 'get',
            headers: {
              'FM-Data-token': `${this.connection.token}`
            },
            qs: this._sanitizeParameters(parameters),
            json: true
          })
        )
        .then(response => this.connection.extend(response))
        .then(response => resolve(response))
        .catch(response => reject(response.message))
    );
  }
  /**
   * @method list
   * @public
   * @memberof Filemaker
   * @description Retrieves a list of FileMaker records based upon a layout.
   * @param {String} layout The layout to use when retrieving the record.
   * @param {Object} parameters the parameters to use to modify the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  list(layout, parameters) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          request({
            url: this._listURL(layout),
            method: 'get',
            headers: {
              'FM-Data-token': `${this.connection.token}`
            },
            qs: this._sanitizeParameters(parameters),
            json: true
          })
        )
        .then(response => this.connection.extend(response))
        .then(response => resolve(response))
        .catch(response => reject(response.message))
    );
  }
  /**
   * @method find
   * @public
   * @memberof Filemaker
   * @description performs a FileMaker find.
   * @param {String} layout The layout to use when performing the find.
   * @param {Object} query to use in the find request.
   * @param {Object} parameters the parameters to use to modify the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  find(layout, query, parameters) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          request({
            url: this._findURL(layout),
            method: 'post',
            headers: {
              'FM-Data-token': `${this.connection.token}`,
              'Content-Type': 'application/json'
            },
            body: Object.assign(
              { query: query },
              this._sanitizeParameters(parameters)
            ),
            json: true
          })
        )
        .then(response => this.connection.extend(response))
        .then(response => resolve(response))
        .catch(response => reject(response.message))
    );
  }
  /**
   * @method globals
   * @public
   * @memberof Filemaker
   * @description Sets global fields for the current session.
   * @param  {Object|Array} data a json object containing the name value pairs to set.
   * @return {Object}      a json object containing fieldData from the record.
   */
  globals(data) {
    return new Promise((resolve, reject) =>
      this.authenticate()
        .then(token =>
          request({
            url: this._globalsURL(),
            method: 'put',
            headers: {
              'FM-Data-token': `${this.connection.token}`,
              'Content-Type': 'application/json'
            },
            body: { globalFields: data },
            json: true
          })
        )
        .then(response => this.connection.extend(response))
        .then(response => resolve(response))
        .catch(response => reject(response.message))
    );
  }
  /**
   * @method fieldData
   * @public
   * @memberof Filemaker
   * @description fieldData is a helper method that strips the filemaker structural layout and portal information
   * from a record. It returns only the data contained in the fieldData key and the recordId.
   * @param  {Object|Array} data the raw data returned from a filemaker. This can be an array or an object.
   * @return {Object}      a json object containing fieldData from the record.
   */
  fieldData(data) {
    return Array.isArray(data)
      ? _.map(data, object =>
          Object.assign({}, object.fieldData, {
            recordId: object.recordId
          })
        )
      : data.fieldData;
  }
  /**
   * @method recordId
   * @public
   * @memberof Filemaker
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

module.exports = {
  Filemaker
};
