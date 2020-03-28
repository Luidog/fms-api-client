'use strict';

const moment = require('moment');
const { EmbeddedDocument } = require('marpat');
const { v4: uuidv4 } = require('uuid');
/**
 * @class Session
 * @classdesc The class used to save FileMaker Data API Session information
 */
class Session extends EmbeddedDocument {
  /** @constructs */
  constructor() {
    super();
    this.schema({
      /** A string containing a unique identifier for a session.
       * @member Session#id
       * @type String
       */
      id: {
        type: String,
        default: () => uuidv4()
      },
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
        default: () => moment().add(15, 'minutes').format()
      },
      /* A string containing the last time the token was used.
       * @member Session#used
       * @type String
       */
      used: {
        type: String
      },
      /* A boolean set if the current session is in use.
       * @member Session#active
       * @type Boolean
       */
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
   * @see  {@link Agent#watch}
   * @see  {@link Connection#available}
   * @description This method checks to see if the session is not currently active and not expired.
   * @return {Boolean} True if the token is valid, otherwise False.
   */
  valid() {
    return (
      !this.active &&
      this.token !== undefined &&
      moment().isBetween(this.issued, this.expires, '()')
    );
  }

  /**
   * @method expired
   * @public
   * @memberof Session
   * @description This method checks to see if a session has expired.
   * @see  {@link Agent#watch}
   * @see  {@link Connection#available}
   * @return {Boolean} True if the token has expired, otherwise False.
   */
  expired() {
    return moment().isSameOrAfter(this.expires);
  }

  /**
   * @method extend
   * @memberof Session
   * @public
   * @description This method extends a Data API session and sets it to inactive.
   * @see  {@link Agent#handleResponse}
   */
  extend() {
    this.active = false;
    this.expires = moment().add(15, 'minutes').format();
  }
}

module.exports = {
  Session
};
