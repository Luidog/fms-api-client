'use strict';

const https = require('https');
const http = require('http');
const uuidv4 = require('uuid/v4');
const { EmbeddedDocument } = require('marpat');
const {
  instance,
  interceptRequest,
  interceptResponse,
  interceptError
} = require('../services');

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
       * @member Agent#concurrency
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

  preInit(data) {
    let { agent, protocol } = data;
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
            httpAgent: new http.Agent(this.Agent)
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
            request: interceptRequest(request),
            resolve
          })
        ),
      error => interceptError(error)
    );

    instance.interceptors.response.use(
      response => interceptResponse(response),
      error => interceptError(error)
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

  push(handler) {
    this.queue.push(handler);
    if (this.pending.length < this.concurrency) {
      this.shift();
      this.watch();
    }
  }

  shift() {
    if (this.pending.length < this.concurrency) {
      let queued = this.queue.shift();
      this.pending.push(queued);
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
        let resolved = this.pending.shift();

        resolved.resolve(Object.assign(resolved.request, this._localize()));
      }
    }, this.delay);
  }
}

module.exports = {
  Agent
};
