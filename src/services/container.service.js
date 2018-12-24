'use strict';

const fs = require('fs');
const path = require('path');
const toArray = require('stream-to-array');
const { CookieJar } = require('tough-cookie');
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

const transport = (url, name, destination, parameters = {}) =>
  instance
    .get(
      url,
      Object.assign(
        {
          jar: new CookieJar()
        },
        parameters,
        {
          responseType: 'stream',
          withCredentials: true
        }
      )
    )
    .then(response =>
      destination && destination !== 'buffer'
        ? writeFile(response.data, name, destination)
        : bufferFile(response.data, name)
    );

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
    stream.on('end', () =>
      resolve({ name, path: path.join(destination, name) })
    );
    output.on('error', error => reject({ message: error.message, code: 100 }));
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
 * @param  {String} field optional request configuration parameters.
 * @param  {String} name optional request configuration parameters.
 * @param  {String} destination optional request configuration parameters.
 * @param  {Object} parameters optional request configuration parameters.
 * @return {Promise}      a promise which will resolve to the file data.
 */

const containerData = (data, field, name, destination, parameters) => {
  return Array.isArray(data)
    ? Promise.all(
        data.map(datum => {
          return transport(
            _.get(datum, field),
            _.get(datum, name, name),
            destination,
            parameters
          );
        })
      )
    : transport(
        _.get(data, field),
        _.get(data, name, name),
        destination,
        parameters
      );
};

module.exports = {
  containerData
};
