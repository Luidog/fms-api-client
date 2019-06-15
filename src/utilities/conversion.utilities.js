'use strict';

const _ = require('lodash');

/**
 * @class Conversion Utilities
 */

/**
 * @function toStrings
 * @public
 * @memberof Conversion Utilities
 * @description The toStrings function converts arrays of objects or a single object into stringified values.
 * @see stringify
 * @param  {Object|Array} data The data to stringify.
 * @return {Object|Array}      a JSON object containing stringified data.
 */

const toStrings = data =>
  Array.isArray(data) ? data.map(datum => stringify(datum)) : stringify(data);

/**
 * @function stringify
 * @public
 * @memberof Conversion Utilities
 * @description The stringify function converts numbers, objects, or booleans to strings.
 * @param  {Object} data The object to stringify.
 * @return {Object}      a JSON object containing stringified data.
 */

const stringify = data =>
  _.mapValues(data, value =>
    typeof value === 'string'
      ? value
      : typeof value === 'object'
      ? JSON.stringify(value)
      : value.toString()
  );

/**
 * @function toArray
 * @public
 * @memberof Conversion Utilities
 * @description The toArray function converts an object into an array. This function uses the object prototype function
 * isArray to check if the incoming data is an array. If the incoming data is not an array this function will
 * return the data in an array.
 * @param  {Object|Array} data An array or object containing query information. This can be an array or an object.
 * @return {Object}      An array containing the data passed to the function.
 */

const toArray = data => (Array.isArray(data) ? data : [data]);

/**
 * @function isJSON
 * @public
 * @memberof Conversion Utilities
 * @description The isJSON function uses the try / catch to parse incoming data safely as JSON.
 * This function will return true if it is able to cast the incoming data as JSON.
 * @param  {Any} data The data to be evaluated as JSON.
 * @return {Boolean}      A boolean result depending on if the data passed to it is valid JSON
 */

const isJSON = data => {
  data = typeof data !== 'string' ? JSON.stringify(data) : data;

  try {
    data = JSON.parse(data);
  } catch (e) {
    return false;
  }

  if (typeof data === 'object' && data !== null) {
    return true;
  }

  return false;
};

/**
 * @function isEmptyObject
 * @public
 * @memberof Conversion Utilities
 * @description The isEmptyObject function uses the try / catch to parse incoming data safely as JSON.
 * This function will return true if it is able to cast the incoming data as JSON.
 * @see stringify
 * @param  {Any} data The data to be evaluated as JSON.
 * @return {Boolean}      A boolean result depending on if the data passed to it is valid JSON.
 */

const isEmpty = data => (isJSON(data) ? _.isEmpty(data) : false);

/**
 * @function omit
 * @public
 * @memberof Conversion Utilities
 * @description The omit function will remove properties from the first object or array passed to it that are in the second parameter passed it.
 * @param  {Object|Array} data The data to parse for omits.
 * @param  {Array} properties An array properties to remove.
 * @return {Object|Array} A JSON object or array of objects without the properties passed to it.
 */

const omit = (data, properties) =>
  Array.isArray(data)
    ? _.map(data, object => _.omit(object, properties))
    : _.omit(data, properties);

/**
 * @function parse
 * @public
 * @memberof Conversion Utilities
 * @description The parse function performs a try catch before attempting to parse the value as JSON. If the value is not valid JSON it wil return the value.
 * @see isJSON
 * @param  {Any} values The value to attempt to parse.
 * @return {Object|Any} A JSON object or array of objects without the properties passed to it
 */

const parse = value => (isJSON(value) ? JSON.parse(value) : value);

/**
 * @function deepMapKeys
 * @public
 * @memberof Conversion Utilities
 * @description deepMapKeys provides deep mapping of objects using a recursive lodash function. This function expects an iteratee that matches the iteratee of _.mapKeys.
 * @param  {Object|Array} object The object or array to deep map
 * @param {Function} iteratee The function to use to map the object's keys.
 * @return {Object|Array} An object or array whose keys or members are modified by the iteratee.
 */

const deepMapKeys = (data, iteratee) =>
  Array.isArray(data)
    ? data.map((value, key) =>
        _.isObject(value) ? deepMapKeys(value, iteratee) : value
      )
    : _.mapValues(_.mapKeys(data, iteratee), value =>
        _.isObject(value) ? deepMapKeys(value, iteratee) : value
      );

module.exports = {
  toStrings,
  stringify,
  toArray,
  isJSON,
  isEmpty,
  omit,
  parse,
  deepMapKeys
};
