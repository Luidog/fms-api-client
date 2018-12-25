'use strict';

const _ = require('lodash');

/**
 * @module Conversion Utilities
 */

/**
 * @method toStrings
 * @public
 * @descript toStrings is a helper method that converts arrays of objects or a single object
 * into stringified values
 * @see stringify
 * @param  {Object|Array} data The data to stringify.
 * @return {Object|Array}      a json object containing stringified data.
 */

const toStrings = data =>
  Array.isArray(data) ? data.map(datum => stringify(datum)) : stringify(data);

/**
 * @method stringify
 * @public
 * @description stringify is a helper method that converts numbers, objects, or booleans to strings.
 * @param  {Object} data The object to stringify.
 * @return {Object}      a json object containing stringified data.
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
 * @method toArray
 * @public
 * @description The toArray method converts an object into an array. This method uses the object prototype method
 * isArray to check if the incoming data is an array. If the incoming data is not an array this method will
 * return the data in an array
 * @param  {Object|Array} data An array or object containing query information. This can be an array or an object.
 * @return {Object}      An array containing the data passed to the method.
 */

const toArray = data => (Array.isArray(data) ? data : [data]);

/**
 * @method isJson
 * @public
 * @description The isJson method uses the a try / catch to parse incoming data safely as json.
 * This method will return true if it is able to cast the incoming data as json.
 * @param  {Any} data The data to be evaluated as json.
 * @return {Boolean}      A boolean result depending on if the data passed to it is valid JSON
 */

const isJson = data => {
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
 * @method omit
 * @public
 * @description omit will remove properties from the first object or array passed to it that are in the second parameter passed it.
 * @param  {Array} properties An array properties to remove.
 * @return {Object|Array} A json object or array of objects without the properties passed to it
 */

const omit = (data, properties) =>
  Array.isArray(data)
    ? _.map(data, object => _.omit(object, properties))
    : _.omit(data, properties);

/**
 * @method parse
 * @public
 * @description parse performs a try catch before attempting to parse the value as json. If the value is not valid json it wil return the value.
 * @param  {Any} values The value to attempt to parse.
 * @return {Object|Any} A json object or array of objects without the properties passed to it
 */

const parse = value => (isJson(value) ? JSON.parse(value) : value);

module.exports = {
  toStrings,
  stringify,
  toArray,
  isJson,
  omit,
  parse
};
