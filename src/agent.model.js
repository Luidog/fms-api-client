'use strict';

const axios = require('axios');
const https = require('https');
const http = require('http');
const { EmbeddedDocument } = require('marpat');
const { interceptRequest, handleResponseError } = require('./utilities');

const instance = axios.create(this.configuration);

instance.interceptors.request.use(interceptRequest);
instance.interceptors.response.use(response => response, handleResponseError);

/**
 * @class Request
 * @classdesc The class used to integrate with the FileMaker server Data API
 */
class Agent extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /**
       * The version of Data API to use.
       * @member Client#version
       * @type String
       */
      configuration: {
        type: Object,
        required: false,
        default: {}
      }
    });
  }

  preInit(data) {
    let { http, https, ...configuration } = data;
    this.configuration = Object.assign(
      configuration,
      http ? new http.Agent(data.http) : {},
      https ? new https.Agent(data.https) : {}
    );
  }

  request(data, configuration = {}) {
    return instance(Object.assign(data, this.configuration, configuration));
  }
}

module.exports = {
  Agent
};
