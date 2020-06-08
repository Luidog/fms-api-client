'use strict';

const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { EmbeddedDocument } = require('marpat');
const _ = require('lodash');
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
  /** @constructs */
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
   */
  preInit({ agent, protocol, timeout, concurrency, connection }) {
    this.concurrency = concurrency > 0 ? concurrency : 1;

    this.connection = Connection.create(connection);
    if (agent) this.globalize(protocol, agent);
  }

  /**
   * preDelete is a hook
   * @schema
   * @description The agent preDelete hook will remove an Agent
   * from the global scope when the client is destroyed.
   * @param {Object} data The data used to create the client.
   */
  preDelete() {
    if (
      global.FMS_API_CLIENT.AGENTS &&
      global.FMS_API_CLIENT.AGENTS[this.global]
    ) {
      this.localize()[`${this.protocol}Agent`].destroy();
      delete global.FMS_API_CLIENT.AGENTS[this.global];
    }
  }

  /**
   * @method globalize
   * @private
   * @memberof Agent
   * @description globalize will create the global agent scope if it does not
   * exist. It will set a global Id for retrieval later and create a new http or
   * https module depending on the protocol passed to it.
   * @param  {String} protocol   The protocol to use when creating an Agent.
   * @param  {Object} agent      The name of the script
   * @return {Object}       returns a globalized request agent
   */
  globalize(protocol, agent) {
    if (!this.global) this.global = uuidv4();
    /**
     * @global
     */
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
   * @method localize
   * @private
   * @memberof Agent
   * @description localize will check to see if a global agent exists.
   * If the agent does not exist this method will call _globalize to add
   * it.
   * @see globalize
   * @return {Object} returns a globalized request agent
   */
  localize() {
    if (typeof global.FMS_API_CLIENT.AGENTS === 'undefined')
      global.FMS_API_CLIENT.AGENTS = [];
    if (global.FMS_API_CLIENT.AGENTS[this.global]) {
      return global.FMS_API_CLIENT.AGENTS[this.global];
    } else {
      return this.globalize(this.protocol, this.agent);
    }
  }

  /**
   * @method request
   * @public
   * @memberof Agent
   * @description request will merge agent properties with request properties
   * in order to make the request. This method removes httpAgent and httpsAgents through destructoring.
   * @see {@link localize}
   * @see {@link push}
   * @see {@link handleResponse}
   * @see {@link handleRequest}
   * @see {@link handleError}
   * @param  {Object} data The request
   * @param  {Object} [parameters] The request parameters. Individualized request parameters.
   * @return {Object} request The configured axios instance to use for a request.
   */
  request(data, parameters = {}) {
    const id = uuidv4();
    const interceptor = instance.interceptors.request.use(
      ({ httpAgent, httpsAgent, ...request }) => {
        instance.interceptors.request.eject(interceptor);
        return new Promise((resolve, reject) =>
          this.push({
            request: this.handleRequest(request, id),
            resolve,
            reject
          })
        );
      }
    );

    const response = instance.interceptors.response.use(
      response => {
        instance.interceptors.response.eject(response);
        return this.handleResponse(response, id);
      },
      error => {
        instance.interceptors.response.eject(response);
        return this.handleError(error, id);
      }
    );

    return instance(
      Object.assign(
        data,
        this.timeout ? { timeout: this.timeout } : {},
        _.isEmpty(this.proxy) ? {} : { proxy: this.proxy },
        _.isEmpty(this.agent) ? {} : this.localize(),
        parameters.request || {}
      )
    );
  }

  /**
   * @method handleResponse
   * @private
   * @memberof Agent
   * @description handles request data before it is sent to the resource. This function
   * will eventually be used to cancel the request and return the configuration body.
   * This function will test the url for an http proticol and reject if none exist.
   * @param  {Object} response The axios response.
   * @param {String} id the request id.
   * @return {Promise}      the request configuration object
   */
  handleResponse(response, id) {
    const token = _.get(response, 'config.headers.Authorization');
    if (token) {
      this.connection.deactivate(token, id);
    }
    if (typeof response.data !== 'object') {
      return Promise.reject({
        message: 'The Data API is currently unavailable',
        code: '1630'
      });
    } else {
      this.connection.extend(token);
      return response;
    }
  }

  /**
   * @method handleRequest
   * @private
   * @memberof Agent
   * @description handles request data before it is sent to the resource. This function
   * will eventually be used to cancel the request and return the configuration body.
   * This function will test the url for an http proticol and reject if none exist.
   * @param  {Object} config The axios request configuration.
   * @param {String} id the request id.
   * @return {Promise}      the request configuration object
   */
  handleRequest(config, id) {
    config.id = id;
    return config.url.startsWith('http')
      ? omit(config, ['params.request', 'data.request'])
      : Promise.reject({
          code: '1630',
          message: 'The Data API Requires https or http'
        });
  }

  /**
   * @method push
   * @private
   * @memberof Agent
   * @description the push method queues requests and begins the request watcher process. This method will also call shift to
   * ensure a request is being processed.
   * @param  {Object} agent The agent request configuration.
   * @param  {Object} agent.request The agent request object.
   * @param  {Function} agent.resolve The function to call when the request has been completed.
   * @see  {@link Agent#watch}
   * @see  {@link Agent#mutate}
   * @see  {@link Agent#shift}
   */
  push({ request, resolve, reject }) {
    this.queue.push({
      request: this.mutate(request, (value, key) =>
        key.replace(/\./g, '{{dot}}')
      ),
      resolve
    });

    this.shift();
    this.watch(reject);
  }

  /**
   * @method shift
   * @private
   * @memberof Agent
   * @description the shift method will send a request if there are less pending requests than the set limit.
   * @see {@link agent#concurrency}
   */
  shift() {
    if (this.pending.length < this.concurrency) {
      this.pending.push(this.queue.shift());
    }
  }

  /**
   * @method mutate
   * @private
   * @memberof Agent
   * @description This method is used to modify keys in an object. This method is used by the watch and resolve methods to
   * allow request data to be written to the datastore.
   * @see {@link Agent#resolve}
   * @see {@link Agent#watch}
   * @see {@link Conversion Utilities#deepMapKeys}
   * @param  {Object} request The agent request object.
   * @param  {Function} mutation The function to upon each key in the request.
   * @return {Object} This mutated request
   */
  mutate(request, mutation) {
    const {
      transformRequest,
      transformResponse,
      adapter,
      validateStatus,
      ...value
    } = request;

    const modified = request.url.includes('/containers/')
      ? request
      : deepMapKeys(value, mutation);

    return {
      ...modified,
      transformRequest,
      transformResponse,
      adapter,
      validateStatus
    };
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
   * @param {String} id the request id.
   * @return {Promise}      A promise rejection containing a code and a message
   */
  handleError(error, id) {
    const token = _.get(error, 'config.headers.Authorization');
    if (token) {
      this.connection.deactivate(token, id);
    }
    
    this.connection.confirm();

    if (error.code) {
      return Promise.reject({ code: error.code, message: error.message });
    } else if (
      error.response.status === 502 ||
      typeof error.response.data !== 'object'
    ) {
      return Promise.reject({
        message: 'The Data API is currently unavailable',
        code: '1630'
      });
    } else {
      if (error.response.data.messages[0].code === '952')
        this.connection.clear(token);
      return Promise.reject(error.response.data.messages[0]);
    }
  }

  /**
   * @method watch
   * @private
   * @memberof Agent
   * @description This method creates a timer to check on the status of queued and resolved requests
   * This method will queue and resolve requests based on the number of incoming requests and the availability
   * of sessions. This method will resolve requests and create sessions based upon the agent's configured concurrency.
   * token response.
   * @param  {Function} reject The reject function from the promise that initiated the function.
   * @see  {@link Agent#concurrency}
   * @see  {@link Connection@available}
   */
  watch(reject) {
    if (!this.global) this.global = uuidv4();
    if (!global.FMS_API_CLIENT.WATCHERS) global.FMS_API_CLIENT.WATCHERS = {};
    if (!global.FMS_API_CLIENT.WATCHERS[this.global]) {
      const WATCHER = setTimeout(
        function watch() {
          this.connection.clear();
          if (
            this.queue.length > 0 &&
            !this.connection.starting &&
            this.connection.available()
          ) {
            this.shift();
          }

          if (
            this.pending.length > 0 &&
            !this.connection.starting &&
            this.connection.available()
          ) {
            this.resolve();
          }

          if (
            this.pending.length > 0 &&
            !this.connection.available() &&
            !this.connection.starting &&
            this.connection.sessions.length < this.concurrency
          ) {
            this.connection
              .start(!_.isEmpty(this.agent) ? this.localize() : false)
              .catch(error => {
                this.pending = [];
                this.queue = [];
                reject(error);
              });
          }

          if (this.queue.length === 0 && this.pending.length === 0) {
            clearTimeout(global.FMS_API_CLIENT.WATCHERS[this.global]);
            delete global.FMS_API_CLIENT.WATCHERS[this.global];
          } else {
            setTimeout(watch.bind(this), this.delay);
          }
        }.bind(this),
        this.delay
      );

      global.FMS_API_CLIENT.WATCHERS[this.global] = WATCHER;
    }
  }

  /**
   * @method resolve
   * @private
   * @memberof Agent
   * @description This method resolves requests by sending them to FileMaker for processing. This method will
   * resolve requests currently in the pending queue. This method will inject the available session token into the request.
   * @see  {@link Agent#pending}
   * @see  {@link Connection@authentication}
   */
  resolve() {
    const pending = this.pending.shift();
    this.connection
      .authentication(
        Object.assign(
          this.mutate(pending.request, (value, key) =>
            key.replace(/{{dot}}/g, '.')
          ),
          { id: pending.request.id }
        ),
        _.isEmpty(this.agent) ? {} : this.localize()
      )
      .then(request =>
        typeof pending.resolve === 'function'
          ? pending.resolve(request)
          : request
      );
  }
}

module.exports = {
  Agent
};
