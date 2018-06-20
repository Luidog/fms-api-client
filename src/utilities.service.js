'use strict';

const _ = require('lodash');

/**
  /**
   * @method _toArray
   * @private
   * @memberof Client
   * @description _toArray is a helper method that converts an object into an array. This is used 
   * @param  {Object|Array} data the raw data returned from a filemaker. This can be an array or an object.
   * @return {Object}      a json object containing stringified data.
   */
const toArray = data => (Array.isArray(data) ? data : [data]);

/**
 * @method _namespace
 * @private
 * @memberof Client
 * @description This method filters the FileMaker DAPI response by testing if a script was triggered with
 * the request, then either selecting the response, script error, and script result from the response or
 * selecting just the response.
 * @return {Object}      a json object containing the selected data from the Data API Response.
 */
const namespace = data =>
  _.mapKeys(
    data,
    (value, key) =>
      _.includes(['limit', 'offset', 'sort'], key) ? `_${key}` : key
  );

/**
 * @method _isJson
 * @private
 * @memberof Client
 * @description This is a helper method for the _filterResponse method.
 * @return {Boolean}      a boolean result if the data passed to it is json
 */
const isJson = data => {
  try {
    JSON.parse(data);
  } catch (e) {
    return false;
  }
  return true;
};

/**
 * @method _stringify
 * @private
 * @memberof Client
 * @description _stringify is a helper method that converts numbers and objects / arrays to strings.
 * @param  {Object|Array} The data being used to create or update a record.
 * @return {Object}      a json object containing stringified data.
 */
const stringify = data =>
  _.mapValues(
    data,
    value =>
      typeof value === 'string'
        ? value
        : typeof value === 'object' ? JSON.stringify(value) : value.toString()
  );

/**
 * @method _filterResponse
 * @private
 * @memberof Client
 * @description This method filters the FileMaker DAPI response by testing if a script was triggered with
 * the request, then either selecting the response, script error, and script result from the response or
 * selecting just the response.
 * @return {Object}      a json object containing the selected data from the Data API Response.
 */
const filterResponse = data =>
  _.mapValues(
    data.response,
    value => (isJson(value) ? JSON.parse(value) : value)
  );

const map = (data, iteratee) => _.map(data, iteratee);

/**
 * @method _sanitizeParameters
 * @memberof Client
 * @private
 * @param {Object} layout the parameters to use when filtering safe parameters and stringifying values
 * @param {Array} safeParameters String values to allow to be sent to filemaker.
 * @description stringifys all values for an object. This is used to ensure that find requests and list requests
 * can use either strings or numbers when setting options.
 * @return {Object} returns an object with all safe keys and values mapped to strings.
 */
const sanitizeParameters = (parameters, safeParameters) =>
  safeParameters
    ? _.mapValues(
        _.pick(parameters, safeParameters),
        value => (_.isNumber(value) ? value.toString() : value)
      )
    : _.mapValues(
        parameters,
        value => (_.isNumber(value) ? value.toString() : value)
      );

module.exports = {
  toArray,
  namespace,
  isJson,
  stringify,
  filterResponse,
  sanitizeParameters,
  map
};
