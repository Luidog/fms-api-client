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
   * @description Generates a url for use when retrieving authentication tokens in exchange for Account credentials


   * @return {String} A URL
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
   * @return {String} A string containing the authentication
   */
  _basicAuth() {
    let auth = `Basic ${new Buffer(
      `${this.credentials.user}:${this.credentials.password}`
    ).toString('base64')}`;
    return auth;
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
          'Content-Type': 'application/json',
          authorization: this._basicAuth()
        },
        data: {}
      })
        .then(response => response.data)
        .then(body => {
          if (body.messages[0].code === '0') {
            this._saveToken(body.response.token);
            resolve(body.response.token);
          } else {
            reject(body.messages[0]);
          }
        })
        .catch(error => reject(error))
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
    this.expires = moment()
      .add(15, 'minutes')
      .format();

    return response;
  }
}
/**
 * @module Connection
 */
module.exports = {
  Connection
};
