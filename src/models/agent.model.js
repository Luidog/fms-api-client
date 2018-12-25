'use strict';

const https = require('https');
const http = require('http');
const uuidv4 = require('uuid/v4');
const { EmbeddedDocument } = require('marpat');
const { instance } = require('../services');

/**
 * @class Agent
 * @classdesc The class used to model the axios http instance and agent
 */

class Agent extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /**
       * The global id for an http or https.agent.
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
       * The client's http or https agent.
       * @member Agent#agent
       * @type String
       */
      agent: {
        type: Object
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
       * A proxy to use for requests.
       * @member Agent#proxy
       * @type String
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
    agent ? this._globalize(protocol, agent) : null;
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
    if (global.AGENTS[this.global]) {
      this._localize()[`${this.protocol}Agent`].destroy();
      delete global.AGENTS[this.global];
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
    !global.AGENTS ? (global.AGENTS = {}) : null;
    !this.global ? (this.global = uuidv4()) : null;
    global.AGENTS[this.global] =
      protocol === 'https'
        ? {
            httpsAgent: new https.Agent(this.agent)
          }
        : {
            httpAgent: new http.Agent(this.Agent)
          };
    return global.AGENTS[this.global];
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
    if (global.AGENTS[this.global]) {
      return global.AGENTS[this.global];
    } else {
      return this._globalize(this.protocol, this.agent);
    }
  }

  /**
   * @method request
   * @public
   * @memberof Agent
   * @description request will merge agent properties with request properties
   * in order to make the request.
   * @see _localize
   * @return {Object} returns the request instance used to make the request.
   */

  request(data, parameters = {}) {
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
}

module.exports = {
  Agent
};
