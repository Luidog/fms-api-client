'use strict';

const { instance } = require('./request.service');
const { urls } = require('../utilities');

const productInfo = (host, version = 'vLatest', parameters = {}) =>
  instance
    .get(urls.productInfo(host, version), parameters)
    .then(response => response.data)
    .then(data => data.response);

const databases = (
  host,
  credentials = {},
  version = 'vLatest',
  parameters = {}
) =>
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
    .then(data => data.response);

module.exports = { productInfo, databases };
