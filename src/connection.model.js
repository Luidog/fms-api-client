'use strict';

const moment = require('moment');
const { EmbeddedDocument } = require('marpat');
const { Credentials } = require('./credentials.model');
const { request } = require('./request.service.js');
/**
 * @class Connection
 * @classdesc The class used to connection with the FileMaker server Data API
 */
class Connection extends EmbeddedDocument {
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
      /** A connection name.
       * @public
       * @member Connection#name
       * @type String
       */
      name: {
        type: String
      },
      /** The FileMaker server (host).
       * @public
       * @member Connection#server
       * @type String
       */
      server: {
        type: String,
        required: true
      },
      /** The FileMaker application (database).
       * @public
       * @member Connection#application
       * @type String
       */
      application: {
        type: String,
        required: true
      },
      /** The client credentials.
       * @public
       * @member Connection#credentials
       * @type Object
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
  /**
   * preInit is a hook
   * @schema
   * @description The connection preInit hook creates an embedded credentials document on create
   * @param {Object} data The data used to create the client.
   * @return {null} The preInit hook does not return anything.
   */
  preInit(data) {
    this.credentials = Credentials.create({
      user: data.user,
      password: data.password
    });
  }
  /**
   * @method _authURL
   * @memberof Connection
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
   * @method _basicAuth
   * @private
   * @memberof Connection
   * @description This method constructs the basic authentication headers used
   * when authenticating a FileMaker DAPI session.
   * @return {String} A string containing the user and password authentication
   * pair.
   */
  _basicAuth() {
    const auth = `Basic ${new Buffer(
      `${this.credentials.user}:${this.credentials.password}`
    ).toString('base64')}`;
    return auth;
  }

  /**
   * @method _saveToken
   * @public
   * @memberof Connection
   * @description Saves a token retrieved from the Data API.
   * @params {Object} data an object. The FileMaker authentication response.
   * @return {String} a token retrieved from the private generation method
   *
   */
  _saveToken(data) {
    this.expires = moment()
      .add(15, 'minutes')
      .format();
    this.issued = moment().format();
    this.token = data.response.token;
    return data;
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
   * response.
   */
  generate() {
    return new Promise((resolve, reject) =>
      request({
        url: this._authURL(),
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          authorization: this._basicAuth()
        },
        data: {}
      })
        .then(response => response.data)
        .then(body => this._saveToken(body))
        .then(body => resolve(body))
        .catch(error => reject(error))
    );
  }
  /**
   * @method clears
   * @memberof Connection
   * @public
   * @description clears the currently saved token, expiration, and issued data by setting them to empty strings. This method
   * returns whatever is passed to it unmodified.
   * @param {Object} response The response object.
   * @return {Object} response The response recieved from the Data API.
   *
   */
  clear(response) {
    this.token = '';
    this.issued = '';
    this.expires = '';

    return response;
  }

  /**
   * @method extend
   * @memberof Connection
   * @public
   * @description Saves a token retrieved from the Data API. This method returns the response recieved to it unmodified.
   * @param {Object} response The response object.
   * @return {Object} response The response recieved from the Data API.
   *
   */
  extend(response) {
    this.expires = moment()
      .add(15, 'minutes')
      .format();

    return response;
  }
}

module.exports = {
  Connection
};
