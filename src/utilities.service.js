'use strict';

const _ = require('lodash');

/**
 * @module Utilities
 */

/**
 * @method toArray
 * @description The toArray method converts an object into an array. This method uses the object prototype method
 * isArray to check if the incoming data is an array. If the incoming data is not an array this method will
 * return the data in an array
 * @param  {Object|Array} data An array or object containing query information. This can be an array or an object.
 * @return {Object}      An array containing the data passed to the method.
 */

const toArray = data => (Array.isArray(data) ? data : [data]);

/**
 * @method namespace
 * @description The namespace method maps through an incoming data object's keys and replaces the properties
 * of limit, offset, and sort with their _ counterparts.
 * @param  {Object} data An object used in a DAPI query.
 * @return {Object}      A modified object containing modified keys to match expected properties
 */

const namespace = data =>
  _.mapKeys(
    data,
    (value, key) =>
      _.includes(['limit', 'offset', 'sort'], key) ? `_${key}` : key
  );

/**
 * @method isJson
 * @description The isJson method uses the a try / catch to parse incoming data safely as json.
 * This method will return tru if it is able to cast the incoming data as json.
 * @param  {Any} data The data to be evaluated as json.
 * @return {Boolean}      A boolean result depending on if the data passed to it is valid JSON
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
 * @method stringify
 * @description stringify is a helper method that converts numbers, objects, and arrays to strings.
 * @param  {Object|Array} data The data being used to create or update a record.
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
 * @method filterResponse
 * @description This method filters the FileMaker DAPI response by testing if a script was triggered
 * with the request, then either selecting the response, script error, and script result from the
 * response or selecting just the response.
 * @param  {Object} data The response recieved from the FileMaker DAPI.
 * @return {Object}      A json object containing the selected data from the Data API Response.
 */
const filterResponse = data =>
  _.mapValues(
    data.response,
    value => (isJson(value) ? JSON.parse(value) : value)
  );

/**
 * @method sanitizeParameters
 * @description The santizeParameters method filters unsafe parameters from its return object based
 * on the safeOarameters array that is passed to it. This method is currently used in the client.create
 * method to seperate the merge option from the paramaters that are safe to send to FileMaker.
 * @param {Object} parameters An array values being passed to the FileMaker DAPI.
 * @param {Array} safeParameters An array values allowed to be sent to filemaker.
 * @return {Object|Array} returns an object or array of objects with only allowed keys
 * and values mapped to strings.
 */

const sanitizeParameters = (parameters, safeParameters) =>
  safeParameters
    ? _.mapValues(
        _.pickBy(
          convertScripts(parameters),
          (value, key) =>
            _.includes(safeParameters, key) ||
            (_.includes(safeParameters, '_offset.*') &&
              _.startsWith(key, '_offset.')) ||
            (_.includes(safeParameters, '_limit.*') &&
              _.startsWith(key, '_limit.')) ||
            (_.includes(safeParameters, 'offset.*') &&
              _.startsWith(key, 'offset.')) ||
            (_.includes(safeParameters, 'limit.*') &&
              _.startsWith(key, 'limit.'))
        ),
        value => (_.isNumber(value) ? value.toString() : value)
      )
    : _.mapValues(
        convertScripts(parameters),
        value => (_.isNumber(value) ? value.toString() : value)
      );

/**
 * @method map
 * @description The map method abstracts the lodash map method to reduce the number of imports required
 * for each model. This method accepts an array and a method to use when mapping the array of values.
 * @param  {Array} data The data to use when invoking the method
 * @param  {Function} iteratee The function to invoke on each item in the array
 * @return {Array}          The mutated array of values after each value is passed to the iteratee method.
 */

const map = (data, iteratee) => _.map(data, iteratee);

/**
 * @method convertScripts
 * @description The converScript method abstracts the lodash map method to reduce the number of imports required
 * for each model. This method accepts an array and a method to use when mapping the array of values.
 * @param  {Object} data The data to use when invoking the method
 * @return {Object}      A new object based on the assignment of incoming properties.
 */
const convertScripts = data => {
  let { scripts, ...parameters } = data;
  let converted = Array.isArray(scripts)
    ? _.chain(scripts)
        .map(script =>
          _.mapKeys(
            script,
            (value, key) =>
              !_.isEmpty(script.phase)
                ? key === 'name'
                  ? `script.${script.phase}`
                  : `script.${script.phase}.${key}`
                : key === 'name' ? `script` : `script.${key}`
          )
        )
        .map(script => _.omitBy(script, (value, key) => key.includes('.phase')))
        .value()
    : [];
  return Object.assign({}, parameters, ...converted);
};

module.exports = {
  toArray,
  namespace,
  isJson,
  stringify,
  filterResponse,
  sanitizeParameters,
  map
};
