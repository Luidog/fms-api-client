'use strict';

const https = require('https');
const http = require('http');
const uuidv4 = require('uuid/v4');
const { EmbeddedDocument } = require('marpat');
const { deepMapKeys } = require('../utilities');
const { Connection } = require('./connection.model');

const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const { omit } = require('../utilities');

const instance = axios.create();

axiosCookieJarSupport(instance);

/**
 * @class Agent
 * @classdesc The class used to model the axios http instance and agent
 */

class Agent extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /**
       * The global id for an http or https.agent
       * @member Agent#global
       * @type String
       */
      global: {
        type: String
      },
      /**
       * The protocol for the client.
       * @member Agent#protocol
       * @type String
       */
      protocol: {
        type: String,
        required: true,
        choices: ['http', 'https']
      },
      /**
       * The client's custom http or https agent.
       * @member Agent#agent
       * @type String
       */
      agent: {
        type: Object
      },
      /**
       * maximum amount of concurrent requests to send.
       * @member Agent#connection
       * @type Class
       */
      connection: {
        type: Connection,
        required: true
      },
      /**
       * maximum amount of concurrent requests to send.
       * @member Connection#concurrency
       * @type Number
       */
      concurrency: {
        type: Number,
        default: () => 1
      },
      /**
       * requests queued for sending.
       * @member Agent#queue
       * @type Array
       */
      queue: {
        type: Array,
        default: () => []
      },
      /**
       * requests awaiting responses.
       * @member Agent#pending
       * @type Array
       */
      pending: {
        type: Array,
        default: () => []
      },
      /**
       * A timeout for requests.
       * @member Agent#timeout
       * @type String
       */
      timeout: {
        type: Number
      },
      /**
       * A delay between checking for request responses.
       * @member Agent#delay
       * @type String
       */
      delay: {
        type: Number,
        default: () => 1
      },
      /**
       * A proxy to use for requests.
       * @member Agent#proxy
       * @type Object
       */
      proxy: {
        type: Object
      }
    });
  }

  /**
   * preInit is a hook
   * @schema
   * @description The agent preInit hook creates a global agent for the
   * client to use if one is required.
   * @see _globalize
   * @param {Object} data The data used to create the agent.
   * @return {null} The preInit hook does not return anything.
   */

  preInit({ agent, protocol, connection }) {
    this.connection = Connection.create(connection);

    if (agent) this._globalize(protocol, agent);
  }

  /**
   * preDelete is a hook
   * @schema
   * @description The agent preDelete hook will remove an Agent
   * from the global scope when the client is destroyed.
   * @param {Object} data The data used to create the client.
   * @return {null} The delete hook does not return anything.
   */

  preDelete() {
    if (global.FMS_API_CLIENT.AGENTS[this.global]) {
      this._localize()[`${this.protocol}Agent`].destroy();
      delete global.FMS_API_CLIENT.AGENTS[this.global];
    }
  }

  /**
   * @method _globalize
   * @private
   * @memberof Agent
   * @description _globalize will create the global agent scope if it does not
   * exist. It will set a global Id for retrieval later and create a new http or
   * https module depending on the protocol passed to it.
   * @param  {String} protocol   The protocol to use when creating an Agent.
   * @param  {Object} agent      The name of the script
   * @return {Object}       returns a globalized request agent
   */

  _globalize(protocol, agent) {
    if (!this.global) this.global = uuidv4();
    global.FMS_API_CLIENT.AGENTS[this.global] =
      protocol === 'https'
        ? {
            httpsAgent: new https.Agent(this.agent)
          }
        : {
            httpAgent: new http.Agent(this.agent)
          };
    return global.FMS_API_CLIENT.AGENTS[this.global];
  }

  /**
   * @method _localize
   * @private
   * @memberof Agent
   * @description _localize will check to see if a global agent exists.
   * If the agent does not exist this method will call _globalize to add
   * it.
   * @see _globalize
   * @return {Object} returns a globalized request agent
   */

  _localize() {
    if (typeof global.FMS_API_CLIENT.AGENTS === 'undefined')
      global.FMS_API_CLIENT.AGENTS = [];
    if (global.FMS_API_CLIENT.AGENTS[this.global]) {
      return global.FMS_API_CLIENT.AGENTS[this.global];
    } else {
      return this._globalize(this.protocol, this.agent);
    }
  }

  /**
   * @method request
   * @public
   * @memberof Agent
   * @description request will merge agent properties with request properties
   * in order to make the request. This method removes httpAgent and httpsAgents through destructoring.
   * @see _localize
   * @return {Object} returns the request instance used to make the request.
   */

  request(data, parameters = {}) {
    instance.interceptors.request.use(
      ({ httpAgent, httpsAgent, ...request }) =>
        new Promise(resolve =>
          this.push({
            request: this.handleRequest(request),
            resolve
          })
        )
    );

    instance.interceptors.response.use(
      response => this.handleResponse(response),
      error => this.handleError(error)
    );

    return instance(
      Object.assign(
        data,
        this.timeout ? { timeout: this.timeout } : {},
        this.proxy ? { proxy: this.proxy } : {},
        this.agent ? this._localize() : {},
        parameters.request || {}
      )
    );
  }

  /**
   * @function handleResponse
   * @public
   * @memberof Request Service
   * @description handles request data before it is sent to the resource. This function
   * will eventually be used to cancel the request and return the configuration body.
   * This function will test the url for an http proticol and reject if none exist.
   * @param  {Object} config The axios request configuration
   * @return {Promise}      the request configuration object
   */

  handleResponse(response) {
    if (typeof response.data !== 'object') {
      return Promise.reject({
        message: 'The Data API is currently unavailable',
        code: '1630'
      });
    } else {
      this.connection.extend(response.config.headers.Authorization);
      return response;
    }
  }

  logout() {
    return this.connection.end();
  }

  login() {
    return this.connection.start();
  }

  /**
   * @function handleRequest
   * @public
   * @memberof Request Service
   * @description handles request data before it is sent to the resource. This function
   * will eventually be used to cancel the request and return the configuration body.
   * This function will test the url for an http proticol and reject if none exist.
   * @param  {Object} config The axios request configuration
   * @return {Promise}      the request configuration object
   */

  handleRequest(config) {
    return config.url.startsWith('http')
      ? omit(config, ['params.request', 'data.request'])
      : Promise.reject({
          message: 'The Data API Requires https or http'
        });
  }

  push({ request, resolve }) {
    this.queue.push({ request: this.sanitize(request), resolve });
    if (this.pending.length < this.concurrency) {
      this.shift();
      this.watch();
    }
  }

  shift() {
    if (this.pending.length < this.concurrency) {
      this.pending.push(this.queue.shift());
    }
  }

  sanitize(request) {
    let {
      transformRequest,
      transformResponse,
      adapter,
      validateStatus,
      ...value
    } = request;

    if (request.url.includes('/containers/')) {
      return request;
    }

    let sanitized = deepMapKeys(value, (value, key) =>
      key.replace(/\./g, '{{dot}}')
    );

    return {
      ...sanitized,
      transformRequest,
      transformResponse,
      adapter,
      validateStatus
    };
  }

  unsanitize(request) {
    return new Promise((resolve, reject) => {
      let {
        transformRequest,
        transformResponse,
        adapter,
        validateStatus,
        ...value
      } = request;

      let modified = request.url.includes('/containers/')
        ? request
        : deepMapKeys(value, (value, key) => key.replace(/{{dot}}/g, '.'));

      resolve({
        ...modified,
        transformRequest,
        transformResponse,
        adapter,
        validateStatus
      });
    });
  }

  /**
   * @function handleError
   * @public
   * @memberof Agent
   * @description This function evaluates the error response. This function will substitute
   * a non JSON error or a bad gateway status with a JSON code and message error. This
   * function will add an expired property to the error response if it recieves a invalid
   * token response.
   * @param  {Object} error The error recieved from the requested resource.
   * @return {Promise}      A promise rejection containing a code and a message
   */

  handleError(error) {
    if (error.code) {
      return Promise.reject({ code: error.code, message: error.message });
    }
    if (!error.response && !error.code) {
      return Promise.reject({ message: error.message, code: '1630' });
    } else if (
      error.response.status === 502 ||
      typeof error.response.data !== 'object'
    ) {
      return Promise.reject({
        message: 'The Data API is currently unavailable',
        code: '1630'
      });
    } else if (
      error.response.status === 400 &&
      error.request.path.includes('RCType=EmbeddedRCFileProcessor')
    ) {
      return Promise.reject({
        message: 'FileMaker WPE rejected the request',
        code: '9'
      });
    } else if (error.response.data.messages[0].code === '952') {
      this.connection.clear(error.response.config.headers.Authorization);
      return Promise.reject(error.response.data.messages[0]);
    } else {
      return Promise.reject(error.response.data.messages[0]);
    }
  }

  watch() {
    const WATCHER = setInterval(() => {
      if (this.queue.length > 0) {
        this.shift();
      }

      if (this.queue.length === 0 && this.pending.length === 0) {
        clearInterval(WATCHER);
      }

      if (this.pending.length > 0) {
        if (this.connection.available()) {
          let resolved = this.pending.shift();
          this.unsanitize(resolved.request).then(request =>
            resolved.resolve(
              Object.assign(
                this.connection.authentication(request),
                this._localize()
              )
            )
          );
        }
        if (
          this.connection.sessions.length <= this.concurrency &&
          !this.connection.starting
        ) {
          // console.log('watcher', {
          //   concurrency: this.concurrency,
          //   pending: this.pending.length,
          //   sessions: this.connection.sessions.length,
          //   starting: this.connection.starting
          // });
          this.connection.start();
        }
      }
    }, this.delay);
  }
}

module.exports = {
  Agent
};
