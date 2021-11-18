'use strict';

const { EmbeddedDocument } = require('marpat');

/**
 * @class FMDataSource
 * @classdesc The class used to login to one external data source via FM API.
 */
class FMDataSourceItem extends EmbeddedDocument {
  /** @constructs */
  constructor() {
    super();
    this.schema({
      /** The database name
       * @member FMDataSource#password
       * @type String
       */
      database: {
        type: String,
        required: true
      },
      /** The username
       * @member FMDataSource#username
       * @type String
       */
      username: {
        type: String,
        required: false
      },
      /** The password
       * @member FMDataSource#password
       * @type String
       */
      password: {
        type: String,
        required: false
      },
      /** The X-FMS-Request-ID header value returned from '/oauth/getoauthurl' in FileMaker Server OAuth workflow.
       * @member FMDataSource#oAuthRequestId
       * @type String
       */
      oAuthRequestId: {
        type: String,
        required: false
      },
      /** The URL query value for "identifier" in FileMaker Server OAuth workflow.
       * @member FMDataSource@oAuthIdentifier
       * @type String
       */
      oAuthIdentifier: {
        type: String,
        required: false
      }
    });
  }
}

module.exports = {
  FMDataSourceItem
};
