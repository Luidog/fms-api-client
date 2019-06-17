'use strict';

const { instance } = require('./request.service');
const { urls } = require('../utilities');

/**
 * @class Metadata Service
 */

/**
 * @function productInfo
 * @public
 * @memberof Metadata Service
 * @description The productInfo function gets FileMaker server metadata information.
 * @see urls#productInfo
 * @param {String} host The host FileMaker server.
 * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
 * @param  {Object} [parameters]  Request configuration parameters.
 * @return {Promise} A promise that will either resolve or reject based on the Data API.
 */

const productInfo = (host, version = 'vLatest', parameters = {}) =>
  new Promise((resolve, reject) => {
    if (!host) reject({ message: 'You must specify a host', code: '1630' });
    instance
      .get(urls.productInfo(host, version), parameters)
      .then(response => response.data)
      .then(data => resolve(data.response.productInfo))
      .catch(error => reject(error));
  });

/**
 * @function databases
 * @public
 * @memberof Metadata Service
 * @description The databases function gets a list of databases that are accessible either without credentials or with the credentials bassed to it.
 * @see urls#databases
 * @param {String} host The host FileMaker server.
 * @param {String} [credentials] Credentials to use when getting a list of databases.
 * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
 * @param  {Object} [parameters]  Request configuration parameters.
 * @return {Promise} A promise that will either resolve or reject based on the Data API.
 */

const databases = (
  host,
  credentials = {},
  version = 'vLatest',
  parameters = {}
) =>
  new Promise((resolve, reject) => {
    if (!host) reject({ message: 'You must specify a host', code: '1630' });
    instance
      .get(
        urls.databases(host, version),
        Object.assign(
          typeof credentials === 'object' &&
            credentials.user &&
            credentials.password
            ? {
                headers: {
                  Authorization: `Basic ${Buffer.from(
                    `${credentials.user}:${credentials.password}`
                  ).toString('base64')}`
                }
              }
            : parameters
        )
      )
      .then(response => response.data)
      .then(data => resolve(data.response))
      .catch(error => reject(error));
  });

module.exports = { productInfo, databases };
