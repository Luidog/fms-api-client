'use strict';

const { EmbeddedDocument } = require('marpat');

/**
 * @class Credentials
 * @classdesc The class used to authenticate with into the FileMaker API.
 */
class Credentials extends EmbeddedDocument {
  /**
   * Credentials constructor.
   * @constructs Credentials
   */
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
      /** A string containing the time the token will expire.
       * @member Credentials#layout
       * @type String
       */
      layout: {
        type: String
      },
      /** The token to use when querying an endpoint.
       * @member Credentials#user
       * @type String
       */
      user: {
        type: String
      }
    });
  }
}
module.exports = {
  Credentials
};
