'use strict';

const axios = require('axios');
const https = require('https');
const http = require('http');
const { EmbeddedDocument } = require('marpat');
const { interceptRequest, handleResponseError } = require('./utilities');

/**
 * @class Request
 * @classdesc The class used to integrate with the FileMaker server Data API
 */
class Axios extends EmbeddedDocument {
  constructor() {
    super();
    this.schema({
      /**
       * The version of Data API to use.
       * @member Client#version
       * @type String
       */
      configuration: {
        type: String,
        required: false,
        default: '1'
      }
    });
  }

  preInit(data) {
    let configuration = {};
    if (data.httpsAgent) {
      configuration.httpsAgent = new https.Agent(data.httpsAgent);
    } else if (data.httpAgent) {
      configuration.httpAgent = new http.Agent(data.httpAgent);
    }
    const instance = axios.create(Object.assign(data, configuration));
    instance.interceptors.request.use(interceptRequest);
    instance.interceptors.response.use(
      response => response,
      handleResponseError
    );
    this.instance = instance;
  }

  instance() {}

  request(data) {
    return this.instance(data);
  }
}

module.exports = {
  Axios
};
