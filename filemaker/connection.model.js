'use strict';

const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { EmbeddedDocument } = require('marpat');
const { Credentials } = require('./credentials.model');
/**
 * @class Connection
 * @classdesc The class used to connection with the FileMaker server Data API
 */
class Connection extends EmbeddedDocument {
  /**
   * Connection constructor.
   * @constructs Connection
   */
  constructor() {
    super();
    this.schema({
      /** A string containing the time the token token was issued.
       * @member Connection#issued
       * @type String
       */
      issued: {
        type: String
      },
      server: {
        type: String,
        required: true
      },
      application: {
        type: String,
        required: true
      },
      /** The client credentials.
       * @public
       * @member Credentials
       * @type Class
       */
      credentials: Credentials,
      /* A string containing the time the token will expire.
             * @member Connection#expires
             * @type String
         */
      expires: {
        type: String
      },
      /** The token to use when querying an endpoint.
       * @member Connection#token
       * @type String
       */
      token: {
        type: String
      }
    });
  }

  preInit(data) {
    this.credentials = Credentials.create({
      user: data.user,
      layout: data.layout,
      password: data.password
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
   * @method _stringify
   * @private
   * @memberof Connection
   * @description _stringify is a helper method that converts numbers and objects / arrays to strings.
   * @param  {Object|Array} The data being used to create or update a record.
   * @return {Object}      a json object containing stringified data.
   */
  _stringify(data) {
    return _.mapValues(
      data,
      value =>
        typeof value === 'string'
          ? value
          : typeof value === 'object'
            ? JSON.stringify(value)
            : typeof value === 'number' ? value.toString() : ''
    );
  }

  create(token, layout, data) {
    return axios({
      url: this._createURL(layout),
      method: 'post',
      headers: {
        'FM-Data-token': `${token}`,
        'Content-Type': 'application/json'
      },
      data: { data: this._stringify(data) }
    })
      .then(response => response.data)
      .then(response => this.extend(response));
  }
  /**
   * @method _saveToken
   * @public
   * @memberof Connection
   * @description Saves a token retrieved from the Data API.
   * @params {String} token The token to save to the class instance.
   * @return {String} a token retrieved from the private generation method
   *
   */
  _saveToken(token) {
    this.expires = moment()
      .add(15, 'minutes')
      .format();
    this.issued = moment().format();
    this.token = token;
    return token;
  }
  /**
   * @method valid
   * @public
   * @memberof Connection
   * @description Saves a token retrieved from the Data API.
   * @params {String} token The token to save to the class instance.
   * @return {String} a token retrieved from the private generation method
   *
   */
  valid() {
    return (
      this.token !== undefined &&
      moment().isBetween(this.issued, this.expires, '()')
    );
  }
  /**
   * @method generate
   * @memberof Connection
   * @public
   * @description Retrieves an authentication token from the Data API. This promise method will check for
   * a zero string in the response errorCode before resolving. If an http error code or a non zero response error code.
   * is returned this will reject.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   * response
   */
  generate() {
    return new Promise((resolve, reject) =>
      axios({
        url: this._authURL(),
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        data: this.credentials
      })
        .then(response => response.data)
        .then(response => {
          if (response.errorCode === '0') {
            this._saveToken(response.token);
            resolve(response.token);
          } else {
            reject(response.errorMessage);
          }
        })
    );
  }

  /**
   * @method extend
   * @memberof Connection
   * @public
   * @description Saves a token retrieved from the Data API. This method returns the response recieved to it unmodified.
   * @param {Object} response The response object.
   * @return {Promise} the response recieved from the Data API.
   *
   */
  extend(response) {
    this.expires = moment(this.expires)
      .add(15, 'minutes')
      .format();

    return response;
  }
}
module.exports = {
  Connection
};
