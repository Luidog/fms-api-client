'use strict';

const moment = require('moment');
const { EmbeddedDocument } = require('marpat');

/**
 * @class Session
 * @classdesc The class used to save FileMaker Data API Session information
 */

class Session extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /** A string containing the time the token token was issued.
       * @member Session#issued
       * @type String
       */
      issued: {
        type: String,
        default: () => moment().format()
      },
      /* A string containing the time the token will expire.
       * @member Session#expires
       * @type String
       */
      expires: {
        type: String,
        default: () =>
          moment()
            .add(15, 'minutes')
            .format()
      },
      active: {
        type: Boolean,
        default: () => false
      },
      /** The token to use when querying an endpoint.
       * @member Session#token
       * @type String
       */
      token: {
        type: String
      }
    });
  }

  /**
   * @method valid
   * @public
   * @memberof Session
   * @description Saves a token retrieved from the Data API.
   * @params {String} token The token to save to the class instance.
   * @return {String} a token retrieved from the private generation method
   *
   */

  valid() {
    // console.log({
    //   active: this.active,
    //   token: this.token,
    //   expires: this.expires,
    //   between: moment().isBetween(this.issued, this.expires, '()')
    // });
    return (
      !this.active &&
      this.token !== undefined &&
      moment().isBetween(this.issued, this.expires, '()')
    );
  }

  /**
   * @method extend
   * @memberof Session
   * @public
   * @description Saves a token retrieved from the Data API. This method returns the response recieved to it unmodified.
   * @return {Undefined}
   *
   */

  extend() {
    this.active = false;
    this.expires = moment()
      .add(15, 'minutes')
      .format();
  }
}

module.exports = {
  Session
};
