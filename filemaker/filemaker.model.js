'use strict';
const moment = require('moment');
const request = require('request-promise');
const { Document } = require('marpat');
/**
 * @class Filemaker
 * @classdesc The class used to integrate with the FileMaker server Data API
 */
class Filemaker extends Document {
  /**
   * FileMaker constructor.
   * @constructs Filemaker
   */
  constructor() {
    super();

    this.schema({
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
      /** The client application username.
       * @private
       * @member Filemaker#_username
       * @type String
       */
      _username: {
        type: String,
        required: true
      },
      /** The client application password.
       * @private
       * @member Filemaker#_password
       * @type String
       */
      _password: {
        type: String,
        required: true
      },
      /** The layout to use for authentication and globals.
       * @private
       * @member Filemaker#_layout
       * @type String
       */
      _layout: {
        type: String,
        required: true
      },
      /** The client application connection object.
       * @private
       * @member Filemaker#_connection
       * @type Object
       */
      _connection: {
        /** A string containing the time the token token was issued.
         * @memberof Filemaker#_connection
         * @type String
         */
        issued: {
          type: String
        },
        /** A string containing the time the token will expire.
         * @memberof Filemaker#_connection
         * @type String
         */
        expires: {
          type: String
        },
        /** The token to use when querying an endpoint.
         * @memberof Filemaker#_connection
         * @type String
         */
        token: {
          type: String
        }
      }
    });
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
      this._layout
    }`;
    return url;
  }
  /**
   * @method _generateToken
   * @description Retrieves an authentication token from the Data API. This promise method will check for
   * a zero errorCode before resolving. If an http error code or a non zero response error code
   * is returned this promise method will reject.
   * @private
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API
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
          user: this._username,
          password: this._password,
          layout: this._layout
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
   * @method _saveToken
   * @description Saves a token retrieved from the Data API.
   * @params {String} token The token to save to the class instance.
   * @private
   * @return {String} a token retrieved from the private generation method
   *
   */
  _saveToken(token) {
    return new Promise((resolve, reject) => {
      this._connection.token = token;
      this._connection.issued = moment().format();
      this._connection.expires = moment()
        .add(15, 'minutes')
        .format();
      this.save()
        .then(response => resolve(this._connection.token))
        .catch(error => reject(error));
    });
  }
  /**
   * @method _extendToken
   * @description Saves a token retrieved from the Data API. This method returns the response recieved to it unmodified.
   * @param {Object} response The response object.
   * @private
   * @return {Promise} the response recieved from the Data API.
   *
   */
  _extendToken(response) {
    this._connection.expires = moment()
      .add(15, 'minutes')
      .format();
    this.save();
    return response;
  }
  /**
   * @method authenticate
   * @description Checks the private connection schema for a token and if the current time is between when that token was
   * issued and when it will expire. If the connection token is not a string (its empty) or the current time is
   * not between when the token is issued and the time it will expire this method calls the private
   * is returned this promise method will reject.
   * @see {@method _generateToken}
   * @see {@method _saveToken}
   * @public
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   *
   */
  authenticate() {
    return new Promise((resolve, reject) => {
      let currentTime = moment();
      if (
        typeof this._connection.token !== 'object' &&
        currentTime.isBetween(
          this._connection.issued,
          this._connection.expires,
          'second',
          '[)'
        )
      ) {
        resolve(this._connection.token);
      } else {
        this._generateToken()
          .then(token => this._saveToken(token))
          .then(token => {
            resolve(token);
          })
          .catch(error => reject(error));
      }
    });
  }
  /**
   * @method create
   * @description Creates a record in FileMaker. This method accepts a layout variable and a data variable.
   * @param {String} layout The layout to use when creating the layout.
   * @param {Object} data The data to use when creating the layout.
   * @public
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
              'FM-Data-token': `${this._connection.token}`,
              'Content-Type': 'application/json'
            },
            body: { data: data },
            json: true
          })
        )
        .then(response => resolve(response))
        .catch(error => reject(error.message))
    );
  }
  /**
   * @method edit
   * @description Edits a filemaker record.
   * @param {String} layout The layout to use when creating the layout.
   * @param {String} recordId The FileMaker internal record ID to use when editing the record.
   * @param {Object} data The data to use when creating the layout.
   * @param {Object} parameters parameters to use when performing the query.
   * @public
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API
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
              'FM-Data-token': `${this._connection.token}`,
              'Content-Type': 'application/json'
            },
            body: Object.assign({ data: data }, parameters),
            json: true
          })
        )
        .then(response => resolve(response))
        .catch(response => reject(response.message))
    );
  }
  /**
   * @method delete
   * @description Deletes a filemaker record.
   * @param {String} layout The layout to use when creating the layout.
   * @param {String} recordId The FileMaker internal record ID to use when editing the record.
   * @public
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API
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
              'FM-Data-token': `${this._connection.token}`
            },
            json: true
          })
        )
        .then(response => resolve(response))
        .catch(response => reject(response.message))
    );
  }
}

module.exports = {
  Filemaker
};
