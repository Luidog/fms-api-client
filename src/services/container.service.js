'use strict';

const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const { CookieJar } = require('tough-cookie');

axiosCookieJarSupport(axios);

/**
 * @method transport
 * @private
 * @description This method retrieves container data from the FileMaker WPE.
 * @param  {String} url The url to use for retrieval.
 * @param  {Object} object optional request configuration parameters.
 * @return {Promise}      a promise which will resolve to the file.
 */

const transport = (url, parameters = {}) =>
  axios.get(url, {
    jar: new CookieJar(),
    responseType: 'stream',
    withCredentials: true
  });

/**
 * @method containerData
 * @public
 * @description This method retrieves container data from the FileMaker WPE.
 * @param  {Object} data The response recieved from the FileMaker DAPI.
 * @param  {Object} parameters optional request configuration parameters.
 * @return {Promise}      a promise which will resolve to the file data.
 */
const containerData = (data, parameters = {}) =>
  Array.isArray(data)
    ? data.map(datum => transport(data[parameters.field], parameters))
    : transport(data[parameters.field], parameters);

module.exports = {
  containerData
};
