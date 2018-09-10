'use strict';

const axios = require('axios');
const FormData = require('form-data');
const { omit } = require('./utilities.service');

const request = axios.create();

/**
 * @function interceptRequest
 * @description handles request data before it is sent to the resource. This method
 * will eventually be used to cancel the request and return the configuration body.
 * This function will re the request params and data request properties.
 * @param  {Object} config The axios request configuration
 * @return {Promise}      the request configuration object
 */

const interceptRequest = config =>
  omit(config, ['params.request', 'data.request']);

/**
 * @function handleResponseError
 * @description handles a 502 error for the client model. If the request
 * generates a 502 status a message and code is generated for the rejection.
 * @param  {Object} error The error recieved from the requested resource.
 * @return {Promise}      A promise rejection containing a code and a message
 */

const handleResponseError = error =>
  error.response.status === 502
    ? Promise.reject({
        message: 'The Data API is currently unavailable',
        code: '1630'
      })
    : Promise.reject(error.response.data.messages[0]);

request.interceptors.request.use(interceptRequest, error =>
  Promise.reject(error)
);

request.interceptors.response.use(response => response, handleResponseError);

/**
 * @module request
 * @module FormData
 */

module.exports = { request, FormData };
