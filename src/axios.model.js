'use strict';

const axios = require('axios');
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

  preInit(data) {}

  request(data) {
    const instance = axios.create();
    instance.interceptors.request.use(interceptRequest);
    instance.interceptors.response.use(
      response => response,
      handleResponseError
    );
    return instance(data);
  }
}

module.exports = {
  Axios
};
