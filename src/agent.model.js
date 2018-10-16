'use strict';

const axios = require('axios');
const https = require('https');
const http = require('http');
const uuidv4 = require('uuid/v4');
const { EmbeddedDocument } = require('marpat');
const { interceptRequest, handleResponseError } = require('./utilities');

/**
 * @class Agent
 * @classdesc The class used to integrate with the FileMaker server Data API
 */

const instance = axios.create();

instance.interceptors.request.use(interceptRequest);
instance.interceptors.response.use(response => response, handleResponseError);

class Agent extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /**
       * The version of Data API to use.
       * @member Client#version
       * @type String
       */
      global: {
        type: String
      },
      protocol: {
        type: String,
        required: true,
        choices: ['http', 'https']
      },
      agent: {
        type: Object
      },
      timeout: {
        type: Number
      },
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
    if (this.agent && !global.AGENTS[this.global]) {
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

  request(data, configuration = {}) {
    return instance(
      Object.assign(
        data,
        this.timeout ? { timeout: this.timeout } : {},
        this.proxy ? { proxy: this.proxy } : {},
        this.agent ? this.localize() : {},
        configuration
      )
    );
  }
}

module.exports = {
  Agent
};
