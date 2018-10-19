'use strict';

const axios = require('axios');
const https = require('https');
const http = require('http');
const uuidv4 = require('uuid/v4');
const { EmbeddedDocument } = require('marpat');
const { interceptRequest, handleResponseError } = require('./utilities');

/**
 * @class Agent
 * @classdesc The class used to model the axios http instance and agent
 */

const instance = axios.create();

instance.interceptors.request.use(interceptRequest);
instance.interceptors.response.use(response => response, handleResponseError);

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

  preInit(data) {
    let { agent, protocol } = data;
    agent ? this.globalize(protocol, agent) : null;
  }

  globalize(protocol, agent) {
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

  localize() {
    if (global.AGENTS[this.global]) {
      return global.AGENTS[this.global];
    } else {
      return this.globalize(this.protocol, this.agent);
    }
  }

  preDelete() {
    if (global.AGENTS[this.global]) {
      this.localize()[`${this.protocol}Agent`].destroy();
      delete global.AGENTS[this.global];
    }
  }

  request(data, parameters = {}) {
    return instance(
      Object.assign(
        data,
        this.timeout ? { timeout: this.timeout } : {},
        this.proxy ? { proxy: this.proxy } : {},
        this.agent ? this.localize() : {},
        parameters.request || {}
      )
    );
  }
}

module.exports = {
  Agent
};
