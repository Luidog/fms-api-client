'use strict';

const fs = require('fs');
const path = require('path');
const toArray = require('stream-to-array');
const { CookieJar } = require('tough-cookie');
const mime = require('mime-types');
const uuidv4 = require('uuid/v4');
const _ = require('lodash');
const { instance } = require('./request.service');

/**
 * @method transport
 * @private
 * @description This method retrieves container data from the FileMaker WPE.
 * @param  {String} url The url to use for retrieval.
 * @param  {Object} object optional request configuration parameters.
 * @return {Promise}      a promise which will resolve to the file.
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
      let filename = path.extname(name)
        ? name
        : `${name}.${mime.extension(response.headers['content-type'])}`;
      return destination && destination !== 'buffer'
        ? writeFile(response.data, filename, destination)
        : bufferFile(response.data, filename);
    });

/**
 * @method writeFile
 * @private
 * @description This method will write a file to the filesystem
 * @param  {Buffer} stream the stream of data to write.
 * @param  {String} name the file's name and extension.
 * @param  {String} path the path to write the file.
 * @return {Promise}      a promise which will resolve with file path and name.
 */

const writeFile = (stream, name, destination) =>
  new Promise((resolve, reject) => {
    let output = fs.createWriteStream(path.join(destination, name));
    output.on('error', error => reject({ message: error.message, code: 100 }));
    output.on('finish', () =>
      resolve({ name, path: path.join(destination, name) })
    );
    stream.pipe(output);
  });

/**
 * @method bufferFile
 * @private
 * @description This method will write a stream to a buffer object.
 * @param  {Stream} stream The url to use for retrieval.
 * @param  {String} name the name and extension of the file.
 * @return {Promise}      a promise which will resolve with file path and name.
 */

const bufferFile = (stream, name) =>
  toArray(stream).then(parts => ({ name, buffer: Buffer.concat(parts) }));

/**
 * @method containerData
 * @public
 * @description This method retrieves container data from the FileMaker WPE.
 * @param  {Object|Array} data The response recieved from the FileMaker DAPI.
 * @param  {String} field - The container field name to target. This can be a nested property.
 * @param  {String} destination - "buffer" if a buffer object should be returned or the path to write the file.
 * @param  {String} name - The field to use for the file name or a static string.
 * @param  {Object=} parameters - request parameters.
 * @param  {Number=} parameters.timeout - a timeout for the request.
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
