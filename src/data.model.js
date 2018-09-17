'use strict';

const moment = require('moment');
const sizeof = require('object-sizeof');
const pretty = require('prettysize');
const { EmbeddedDocument } = require('marpat');

/**
 * @class Data
 * @classdesc The class used to track FileMaker API data usage.
 **/

class Data extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /** A boolean value set to true if the client should track data usage.
       * @member Data#track
       * @type Boolean
       */
      track: {
        type: Boolean,
        required: true,
        default: true
      },
      /** A number containing the total amount of data called since the class
       * was created or last cleared.
       * @member Data#in
       * @type Number
       */
      in: {
        type: Number,
        required: true,
        default: 0
      },
      /** A number containing the total amount of data called since the class
       * was created or last cleared.
       * @member Data#out
       * @type Number
       */
      out: {
        type: Number,
        required: true,
        default: 0
      },
      /** A string containing the ISO date from the last time the class was created or last cleared.
       * @member Data#out
       * @type string
       */
      since: {
        type: String,
        required: true,
        default: () => moment().format()
      }
    });
  }

  /**
   * @method incoming
   * @public
   * @memberof Data
   * @description increments the amount of data being sent to FileMaker.
   * @param {Any} data The data to record.
   * @return {Any} Returns data unmutated.
   *
   */

  incoming(data) {
    this.track ? (this.in += sizeof(data)) : null;
    return data;
  }

  /**
   * @method outgoing
   * @public
   * @memberof Data
   * @description increments the amount of data being recieved from filemaker.
   * @param {Any} data The data to record.
   * @return {Any} Returns data unmutated.
   *
   */

  outgoing(data) {
    this.track ? (this.out += sizeof(data)) : null;
    return data;
  }

  /**
   * @method clear
   * @public
   * @memberof Data
   * @description Clears the data in and out and resets the since date to the current time as an ISO date string.
   * @return {null} This method does not return anything.
   *
   */

  clear() {
    this.since = moment().format();
    this.in = this.out = 0;
  }

  /**
   * @method status
   * @public
   * @memberof Data
   * @description Prettifies the class data by stringifying the in and out data and returning since.
   * @return {Object} An object contain the key of data with keys of since, in, and out as strings.
   *
   */

  status() {
    const status = {
      data: {
        since: this.since,
        in: pretty(this.in),
        out: pretty(this.out)
      }
    };
    return status;
  }
}

module.exports = {
  Data
};
