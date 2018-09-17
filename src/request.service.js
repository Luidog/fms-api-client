'use strict';

const axios = require('axios');
const FormData = require('form-data');
const { omit } = require('./utilities');

/**
 * @module request
 */

const request = axios.create();

/**
 * @method interceptRequest
 * @private
 * @description handles request data before it is sent to the resource. This method
 * will eventually be used to cancel the request and return the configuration body.
 * This method will test the url for an http proticol and reject if none exist.
 * @param  {Object} config The axios request configuration
 * @return {Promise}      the request configuration object
 */

const interceptRequest = config => {
  if (config.url.startsWith('http')) {
    return omit(config, ['params.request', 'data.request']);
  } else {
    return Promise.reject({
      message: 'The Data API Requires https or http',
      code: '1630'
    });
  }
};

/**
 * @method handleResponseError
 * @description handles a 502 error for the client model. If the request
 * generates a 502 status a message and code is generated for the rejection.
 * @param  {Object} error The error recieved from the requested resource.
 * @return {Promise}      A promise rejection containing a code and a message
 */

const handleResponseError = error => {
  if (!error.response) {
    return Promise.reject(error);
  } else if (
    error.response.status === 502 ||
    typeof error.response.data !== 'object'
  ) {
    return Promise.reject({
      message: 'The Data API is currently unavailable',
      code: '1630'
    });
  } else {
    return Promise.reject(error.response.data.messages[0]);
  }
};

request.interceptors.request.use(interceptRequest);

request.interceptors.response.use(response => response, handleResponseError);

module.exports = { request, FormData };
