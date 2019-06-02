'use strict';

const { instance } = require('./request.service');
const { urls } = require('../utilities');

const productInfo = (host, version = 'vLatest', parameters = {}) =>
  new Promise((resolve, reject) => {
    if (!host) reject({ message: 'You must specify a host', code: '1630' });
    instance
      .get(urls.productInfo(host, version), parameters)
      .then(response => response.data)
      .then(data => resolve(data.response.productInfo))
      .catch(error => reject(error));
  });

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
