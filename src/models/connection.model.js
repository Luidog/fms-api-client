'use strict';

const moment = require('moment');
const { EmbeddedDocument } = require('marpat');
const uuidv4 = require('uuid/v4');
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
      /** The FileMaker database.
       * @public
       * @member Connection#database
       * @type String
       */
      database: {
        type: String,
        required: true
      },
      providers: {
        type: Object
      },
      /** The client credentials.
       * @public
       * @member Connection#credentials
       * @type Object
       */
      credentials: Credentials,
      /* The URL query value for "identifier" in FileMaker Server OAuth workflow.
       * @member Connection#oAuthRequestId
       * @type String
       */
      oAuthRequestId: {
        type: String
      },
      /* The X-FMS-Request-ID header value returned from '/oauth/getoauthurl' in FileMaker Server OAuth workflow.
       * @member Connection#oAuthIdentifier
       * @type String
       */
      oAuthIdentifier: {
        type: String
      },
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
    let {
      application,
      database,
      user,
      password,
      oAuthRequestId,
      oAuthIdentifier
    } = data;
    this.credentials = Credentials.create({
      user,
      password,
      oAuthRequestId,
      oAuthIdentifier
    });
    // This was added to ease the transition to renaming the application property in 2.0.
    this.database = application || database;
  }

  /**
   * @method oAuthProviders
   * @public
   * @memberof Connection
   * @description This method will get the currently configured Open Authentication providers.
   * @return {Any} The request response data
   */

  oAuthProviders(axios, url) {
    return axios
      .request({
        url: url,
        method: 'get'
      })
      .then(response => {
        this._saveProviders(response.data);
        return response.data.data.Provider;
      });
  }

  oAuthURL(axios, url, provider, address, redirect) {
    let trackingID = uuidv4();
    return axios
      .request({
        url: url,
        method: 'get',
        headers: {
          'X-FMS-Return-URL': redirect,
          'X-FMS-Application-Type': '15',
          'X-FMS-Application-Version': '9'
        },
        params: { 'X-FMS-OAuth-AuthType': '2', provider, address, trackingID }
      })
      .then(response => {
        console.log(response);
        // this._saveProviders(response.data);
        return response.data;
      });
  }

  /**
   * @method _saveProviders
   * @private
   * @memberof Connection
   * @description The method checks the incoming result for a non null data property. If
   * a property is found it will be save to the connection providers.
   * @return {Any} The request result unmodified
   */

  _saveProviders(result) {
    if (result.data.Providers) this.providers = result.data.Providers;
    return result;
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
    const auth = `Basic ${Buffer.from(
      `${this.credentials.user}:${this.credentials.password}`
    ).toString('base64')}`;
    return auth;
  }

  /**
   * @method _saveToken
   * @private
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

  generate(axios, url) {
    return new Promise((resolve, reject) =>
      this.credentials.oAuthRequestId && this.credentials.oAuthIdentifier
        ? axios
            .request({
              url: url,
              method: 'post',
              headers: {
                'Content-Type': 'application/json'
              },
              data: {
                fmDataSource: [
                  {
                    database: this.database,
                    oAuthRequestId: this.oAuthRequestId,
                    oAuthIdentifier: this.oAuthIdentifier
                  }
                ]
              }
            })
            .then(response => response.data)
            .then(body => this._saveToken(body))
            .then(body => resolve(body))
            .catch(error => reject(error))
        : axios
            .request({
              url: url,
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
