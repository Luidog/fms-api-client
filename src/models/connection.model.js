'use strict';

const _ = require('lodash');
const moment = require('moment');
const { EmbeddedDocument } = require('marpat');
const { Credentials } = require('./credentials.model');
const { Session } = require('./session.model');
const { urls } = require('../utilities');
const { instance } = require('../services');

/**
 * @class Connection
 * @classdesc The class used to connection with the FileMaker server Data API
 * @constructor
 */
class Connection extends EmbeddedDocument {
  /** @constructs */
  constructor() {
    super();
    this.schema({
      /**
       * The client FileMaker Server.
       * @member Connection#server
       * @type String
       */
      server: {
        type: String,
        validate: data =>
          data.startsWith('http://') || data.startsWith('https://'),
        required: true
      },
      /**
       * The client database name.
       * @member Connection#database
       * @type String
       */
      database: {
        type: String,
        required: true
      },
      /**
       * The version of Data API to use.
       * @member Connection#version
       * @type String
       */
      version: {
        type: String,
        required: true,
        default: 'vLatest'
      },
      /**
       * Open Data API sessions.
       * @member Connection#sessions
       * @see  {@link Session}
       * @type Array
       */
      starting: {
        type: Boolean,
        default: false
      },
      /**
       * Open Data API sessions.
       * @member Connection#sessions
       * @see  {@link Session}
       * @type Array
       */
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

  /**
   * @method preInit
   * @schema
   * @description The preInit method is called on creation of the connection. On creation this preInit will create a credential
   * embedded document.
   * @see  {@link [marpat]https://github.com/Luidog/marpat}
   * @param {Object} data The data used to create the connection.
   * @param {String} data.user The FileMaker user account to use when creating connections.
   * @param {String} data.password The FileMaker user account password.
   */
  preInit({ user, password }) {
    this.credentials = Credentials.create({ user, password });
  }

  /**
   * @method authentication
   * @public
   * @memberof Connection
   * @description the authentication method merges the request passed to it with authentication headers.
   * This method is used to ensure requests are sent with the latest available session authentication.
   * @param {Object} request The request to inject the authentication header
   * @param {Object} request.headers The headers to inject the authentication header into.
   * @see  {@link Connection#available}
   * @return {String} The session token.
   */
  authentication({ headers, ...request }) {
    return new Promise((resolve, reject) => {
      const sessions = _.sortBy(this.sessions, ['active', 'used'], ['desc']);
      const session = sessions[0];
      session.active = true;
      session.url = request.url;
      session.used = moment().format();
      resolve({
        ...request,
        headers: {
          ...headers,
          Authorization: `Bearer ${session.token}`
        }
      });
    });
  }

  /**
   * @method ready
   * @public
   * @memberof Connection
   * @description Saves a token retrieved from the Data API as a sessions
   * @see  {@link session}
   * @return {Boolean} data a boolean indicating if the connection has a session.
   */
  ready() {
    return this.sessions.length > 0;
  }

  /**
   * @method available
   * @public
   * @memberof Connection
   * @description Saves a token retrieved from the Data API as a sessions
   * @see  {@link session}
   * @return {Boolean|Class} data a false boolean or session
   */
  available() {
    const session = _.find(this.sessions, session => session.valid());
    return typeof session === 'undefined' ? false : session;
  }

  /**
   * @method save
   * @public
   * @memberof Connection
   * @description Saves a token retrieved from the Data API as a sessions
   * @see  {@link session}
   * @param {Object} data The FileMaker authentication response.
   * @return {String} a token retrieved from the private generation method
   */
  save(data) {
    this.starting = false;
    return new Promise((resolve, reject) => {
      if (!data.response || !data.response.token)
        reject({
          code: '1760',
          message: 'Unable to parse session token from server response.'
        });
      this.sessions.push(Session.create({ token: data.response.token }));
      this.clear();
      resolve(data.response.token);
    });
  }

  /**
   * @method starts
   * @public
   * @memberof Connection
   * @description Starts a FileMaker Data API session
   * @param {Object} [agent] An optional custom request agent.
   * @return {String} The session token.
   */
  start(agent) {
    this.starting = true;
    return new Promise((resolve, reject) => {
      instance
        .request(
          Object.assign(
            {
              url: urls.authentication(
                this.server,
                this.database,
                this.version
              ),
              method: 'post',
              timeout: 3000
            },
            agent ? { ...agent } : {},
            {
              headers: {
                'Content-Type': 'application/json',
                authorization: this.credentials.basic()
              },
              data: {}
            }
          )
        )
        .then(response => response.data)
        .then(body => this.save(body))
        .then(token => resolve(token))
        .catch(error => {
          this.starting = false;
          reject(error);
        });
    });
  }

  /**
   * @method end
   * @public
   * @memberof Connection
   * @description ends a FileMaker Data API session and clears the session.
   * @see  {@link Connection#clear}
   * @param {Object} [agent] An optional custom request agent.
   * @return {String} The session token.
   */
  end(agent) {
    return new Promise((resolve, reject) => {
      if (this.sessions.length > 0) {
        const session = this.available();
        session.active = true;
        instance
          .request(
            Object.assign(
              {
                url: urls.logout(
                  this.server,
                  this.database,
                  session.token,
                  this.version
                ),
                method: 'delete',
                data: {}
              },
              agent ? { ...agent } : {}
            )
          )
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
   * @param {String} [header] The header containing the token to clear.
   */
  clear(header) {
    this.sessions = this.sessions.filter(session =>
      typeof header === 'string'
        ? header.replace('Bearer ', '') !== session.token || !session.expired()
        : !session.expired()
    );
  }

  /**
   * @method extend
   * @memberof Connection
   * @public
   * @description Saves a token retrieved from the Data API. This method returns the response recieved to it unmodified.
   * @param {String} [header] The header containing the token to clear.
   */
  extend(header) {
    const token = header.replace('Bearer ', '');
    const session = _.find(this.sessions, session => session.token === token);
    if (session) session.extend();
  }
}

module.exports = {
  Connection
};
