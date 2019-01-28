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
        type: String
      },
      /** The token to use when querying an endpoint.
       * @member Credentials#user
       * @type String
       */
      user: {
        type: String
      },
      /** The open authentication request id.
       * @member Credentials#user
       * @type String
       */
      oAuthRequestId: {
        type: String
      },
      /** The open authentication identifier.
       * @member Credentials#oAuthIdentifier
       * @type String
       */
      oAuthIdentifier: {
        type: String
      }
    });
  }

  /**
   * @method update
   * @memberof Credentials
   * @public
   * @description This method updates the credential properties.
   * @return {Any} returns the data sent to it unmodified.
   */

  update(data) {
    let { user, password, oAuthRequestId, oAuthIdentifier } = data;
    this.user = user || this.user;
    this.password = password || this.password;
    this.oAuthRequestId = oAuthRequestId || this.oAuthRequestId;
    this.oAuthIdentifier = oAuthIdentifier || this.oAuthIdentifier;
    return data;
  }
}

module.exports = {
  Credentials
};
