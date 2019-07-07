'use strict';

const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;

const instance = axios.create();

axiosCookieJarSupport(instance);

/**
 * @class Request Service
 */

/**
 * @method interceptError
 * @private
 * @description This method evaluates the error response. This method will substitute
 * a non json error or a bad gateway status with a json code and message error. This
 * method will add an expired property to the error response if it recieves a invalid
 * token response.
 * @param  {Object} error The error recieved from the requested resource.
 * @return {Promise}      A promise rejection containing a code and a message
 */

const interceptError = error => {
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
  } else if (
    error.response.status === 400 &&
    error.request.path.includes('RCType=EmbeddedRCFileProcessor')
  ) {
    return Promise.reject({
      message: 'FileMaker WPE rejected the request',
      code: '9'
    });
  } else {
    return Promise.reject(error.response.data.messages[0]);
  }
};

/**
 * @function interceptResponse
 * @public
 * @memberof Request Service
 * @description handles request data before it is sent to the resource. This function
 * will eventually be used to cancel the request and return the configuration body.
 * This function will test the url for an http proticol and reject if none exist.
 * @param  {Object} config The axios request configuration
 * @return {Promise}      the request configuration object
 */

const interceptResponse = response => {
  console.log(typeof response.data);
  if (typeof response.data !== 'object') {
    return Promise.reject({
      message: 'The Data API is currently unavailable',
      code: '1630'
    });
  } else {
    return response;
  }
};

/**
 * Attach Interceptors to Axios instance
 * @param  {Any} response Web publishing response.
 * @param  {Any} error We publishing error.
 */

instance.interceptors.response.use(
  response => interceptResponse(response),
  error => interceptError(error)
);

module.exports = {
  instance
};
