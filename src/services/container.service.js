'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const toArray = require('stream-to-array');
const _ = require('lodash');
const { instance } = require('./request.service');
const { CookieJar } = require('tough-cookie');

/**
 * @method transport
 * @private
 * @description This method retrieves container data from the FileMaker WPE.
 * @param  {String} url The url to use for retrieval.
 * @param  {Object} object optional request configuration parameters.
 * @return {Promise}      a promise which will resolve to the file.
 */

const transport = (url, name, destination) =>
  instance
    .get(url, {
      jar: true,//new CookieJar(),
      responseType: 'stream',
      withCredentials: true
    })
    .then(response =>
      destination && destination !== 'buffer'
        ? writeFile(response.data, name, destination)
        : bufferFile(response.data, name)
    );

/**
 * @method writeFile
 * @private
 * @description This method will write a file to the filesystem
 * @param  {Buffer} url The url to use for retrieval.
 * @param  {String} name the name and extension of the file.
 * @param  {String} path the path to write the file.
 * @return {Promise}      a promise which will resolve with file path and name.
 */

const writeFile = (stream, name, destination) =>
  new Promise((resolve, reject) => {
    stream.on('end', () =>
      resolve({ name, path: path.join(destination, name) })
    );
    stream.on('finish', () =>
      resolve({ name, path: path.join(destination, name) })
    );
    stream.on('error', error => reject(error));
    fs.createWriteStream(path.join(destination, name));
  });

const bufferFile = (data, name) =>
  toArray(data).then(parts => {
    const buffers = parts.map(part =>
      util.isBuffer(part) ? part : Buffer.from(part)
    );
    return { name, buffer: Buffer.concat(buffers) };
  });

/**
 * @method containerData
 * @public
 * @description This method retrieves container data from the FileMaker WPE.
 * @param  {Object} data The response recieved from the FileMaker DAPI.
 * @param  {Object} parameters optional request configuration parameters.
 * @return {Promise}      a promise which will resolve to the file data.
 */

const containerData = (data, field, name, destination) =>
  Array.isArray(data)
    ? Promise.all(
        data.map(datum =>
          transport(_.get(data, field), _.get(data, name, name), destination)
        )
      )
    : transport(_.get(data, field), _.get(data, name, name), destination);

module.exports = {
  containerData
};
