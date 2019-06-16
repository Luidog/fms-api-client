'use strict';

const _ = require('lodash');
const { EmbeddedDocument } = require('marpat');
const { Credentials } = require('./credentials.model');
const { Session } = require('./session.model');
const { urls } = require('../utilities');
const { instance } = require('../services');

/**
 * @class Connection
 * @classdesc The class used to connection with the FileMaker server Data API
 */

class Connection extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /** The FileMaker server (host).
       * @public
       * @member Connection#server
       * @type String
       */
      server: {
        type: String,
        required: true
      },
      /** The FileMaker Database (database).
       * @public
       * @member Connection#database
       * @type String
       */
      database: {
        type: String,
        required: true
      },
      /**
       * Open Data API sessions.
       * @member Connection#sessions
       * @type Array
       */
      starting: {
        type: Boolean,
        default: false
      },
      sessions: {
        type: [Session],
        default: () => []
      },
      /** A string containing the time the token token was issued.
       * @member Credentials
       * @type class
       */
      credentials: {
        type: Credentials,
        required: true
      }
    });
  }

  preInit({ user, password }) {
    this.credentials = Credentials.create({ user, password });
  }

  authentication({ headers, ...request }) {
    return {
      ...request,
      headers: {
        ...headers,
        Authorization: `Bearer ${this.available().token}`
      }
    };
  }

  available() {
    let session = _.find(this.sessions, session => session.valid());
    return typeof session === 'undefined' ? false : session;
  }

  /**
   * @method save
   * @public
   * @memberof Connection
   * @description Saves a token retrieved from the Data API.
   * @params {Object} data an object. The FileMaker authentication response.
   * @return {String} a token retrieved from the private generation method
   *
   */

  save(data) {
    this.starting = false;
    this.sessions.push(Session.create({ token: data.response.token }));
    return data.response.token;
  }

  start() {
    this.starting = true;
    return new Promise((resolve, reject) => {
      instance
        .request({
          url: urls.authentication(this.server, this.database, this.version),
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            authorization: this.credentials.basic()
          },
          data: {}
        })
        .then(response => response.data)
        .then(body => this.save(body))
        .then(token => resolve(token))
        .catch(error => reject(error));
    });
  }

  end() {
    return new Promise((resolve, reject) => {
      if (this.sessions.length > 0) {
        let session = this.available();
        session.active = true;
        instance
          .request({
            url: urls.logout(
              this.server,
              this.database,
              session.token,
              this.version
            ),
            method: 'delete',
            data: {}
          })
          .then(response => {
            this.clear(session.token);
            resolve(response.data);
          })
          .catch(error => reject(error));
      } else {
        reject({ message: 'No session to Log out' });
      }
    });
  }

  /**
   * @method clear
   * @memberof Connection
   * @public
   * @description clears the currently saved token, expiration, and issued data by setting them to empty strings. This method
   * returns whatever is passed to it unmodified.
   * @param {Object} response The response object.
   * @return {Object} response The response recieved from the Data API.
   *
   */

  clear(header) {
    this.sessions = this.sessions.filter(session =>
      typeof header === 'string'
        ? header.replace('Bearer ', '') === session.token || session.expired()
        : session.expired()
    );
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

  extend(data) {
    let token = data.replace('Bearer ', '');
    let session = _.find(this.sessions, session => session.token === token);
    if (session) session.extend();
  }
}

module.exports = {
  Connection
};
