'use strict';

const { EmbeddedDocument } = require('marpat');

/**
 * @class Credentials
 * @classdesc The class used to authenticate with into the FileMaker API.
 */
class Credentials extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /** A string containing the time the token token was issued.
       * @member Credentials#password
       * @type String
       */
      password: {
        type: String,
        required: true
      },
      /** The token to use when querying an endpoint.
       * @member Credentials#user
       * @type String
       */
      user: {
        type: String,
        required: true
      }
    });
  }

  /**
   * @method basic
   * @public
   * @memberof Credentials
   * @description This method constructs the basic authentication headers used
   * when authenticating a FileMaker DAPI session.
   * @return {String} A string containing the user and password authentication
   * pair.
   */
  basic() {
    const auth = `Basic ${Buffer.from(`${this.user}:${this.password}`).toString(
      'base64'
    )}`;
    return auth;
  }
}

module.exports = {
  Credentials
};
