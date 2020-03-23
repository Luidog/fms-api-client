'use strict';

const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const fs = require('fs');
const path = require('path');
const toArray = require('stream-to-array');
const { CookieJar } = require('tough-cookie');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const { interceptResponse } = require('./request.service')

const instance = axios.create();

axiosCookieJarSupport(instance);

/**
 * @class Container Service
 */

/**
 * Attach Interceptors to Axios instance
 * @param  {Any} response Web publishing response.
 * @param  {Any} error We publishing error.
 */
instance.interceptors.response.use(
  response => interceptResponse(response),
  error => handleError(error)
);

/**
 * @function handleError
 * @private
 * @memberof Container Service
 * @description handles errors from the Web Publishing service by ensuring the error is an object.
 * @param  {Error} error The error recieved from the Web Publishing service.
 * @return {Object} An object with a code and a message.
 */
const handleError = error =>
  Promise.reject({ code: 100, message: error.message });

/**
 * @function transport
 * @private
 * @memberof Container Service
 * @description This function retrieves container data from the FileMaker WPE.
 * @see writeFile
 * @see writeBuffer
 * @param  {String} url The url to use for retrieval.
 * @param  {String} destination The file's destination. Send buffer if it should be set to buffer.
 * @param  {String} name The name of the file.
 * @param  {Object} [parameters]  Request configuration parameters.
 * @return {Promise}      A promise which will resolve to the file.
 */
const transport = (url, destination, name, parameters = {}) =>
  instance
    .get(
      url,
      Object.assign(
        {
          jar: new CookieJar(),
          responseType: 'stream',
          withCredentials: true
        },
        parameters
      )
    )
    .then(response => {
      const filename = path.extname(name)
        ? name
        : `${name}.${mime.extension(response.headers['content-type'])}`;
      return destination && destination !== 'buffer'
        ? writeFile(response.data, filename, destination)
        : bufferFile(response.data, filename);
    });

/**
 * @function writeFile
 * @private
 * @memberof Container Service
 * @description This function will write a file to the filesystem.
 * @param  {Buffer} stream The stream of data to write.
 * @param  {String} name The file's name and extension.
 * @param  {String} destination The destination path to write the file.
 * @return {Promise}      A promise which will resolve with file path and name.
 */
const writeFile = (stream, name, destination) =>
  new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(destination, name));
    output.on('error', error => reject({ message: error.message, code: 100 }));
    output.on('finish', () =>
      resolve({ name, path: path.join(destination, name) })
    );
    stream.pipe(output);
  });

/**
 * @function bufferFile
 * @private
 * @memberof Metadata Service
 * @description This function will write a stream to a buffer object.
 * @param  {Stream} stream The url to use for retrieval.
 * @param  {String} name The name and extension of the file.
 * @return {Promise}      A promise which will resolve with file path and name.
 */
const bufferFile = (stream, name) =>
  toArray(stream).then(parts => ({ name, buffer: Buffer.concat(parts) }));

/**
 * @function containerData
 * @public
 * @memberof Metadata Service
 * @description This function retrieves container data from the FileMaker WPE.
 * @see transport
 * @param  {Object|Array} data The response recieved from the FileMaker DAPI.
 * @param  {String} field The container field name to target. This can be a nested property.
 * @param  {String} destination "buffer" if a buffer object should be returned or the path to write the file.
 * @param  {String} name The field to use for the file name or a static string.
 * @param  {Object=} parameters Request configuration parameters.
 * @param  {Number=} parameters.timeout  a timeout for the request.
 * @return {Promise}      a promise which will resolve to the file data.
 */
const containerData = (data, field, destination, name, parameters) => {
  return Array.isArray(data)
    ? Promise.all(
        data.map(datum =>
          transport(
            _.get(datum, field),
            destination,
            _.get(datum, name, datum.recordId || uuidv4()),
            parameters
          )
        )
      )
    : transport(
        _.get(data, field),
        destination,
        _.get(data, name, data.recordId || uuidv4()),
        parameters
      );
};

module.exports = {
  containerData
};
