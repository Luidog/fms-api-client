'use strict';

const _ = require('lodash');
const { stringify, parse } = require('./conversion.utilities');

/**
 * @module Filemaker Utilities
 */

/**
 * @method convertPortals
 * @public
 * @description The convertPortals method converts a request containing a portal array into the syntax
 * supported by the filemaker data api.
 * @param  {Object|Array} data The data to use when invoking the method
 * @return {Object}      A new object with the FileMaker required parameters for portals.
 */

const convertPortals = data => {
  let portalArray = [];
  let { portals } = data;
  let converted = Array.isArray(portals)
    ? _.chain(portals)
        .map(portal =>
          _.mapKeys(portal, (value, key) =>
            key === 'limit'
              ? `limit.${portal.name}`
              : key === 'offset'
              ? `offset.${portal.name}`
              : key === 'name'
              ? portalArray.push(value)
              : `remove`
          )
        )
        .map(portal => _.omitBy(portal, (value, key) => key.includes('remove')))
        .value()
    : [];
  return Object.assign({ portals: portalArray }, converted);
};

/**
 * @method convertScripts
 * @public
 * @description The converScript method abstracts the lodash map method to reduce the number of imports required
 * for each model. This method accepts an array and a method to use when mapping the array of values.
 * @param  {Object} data The data to use when invoking the method
 * @return {Object}      A new object based on the assignment of incoming properties.
 */

const convertScripts = data => {
  let { scripts } = data;
  let converted = Array.isArray(scripts)
    ? _.chain(scripts)
        .map(script =>
          _.mapKeys(script, (value, key) =>
            !_.isEmpty(script.phase)
              ? key === 'name'
                ? `script.${script.phase}`
                : `script.${script.phase}.${key}`
              : key === 'name'
              ? `script`
              : `script.${key}`
          )
        )
        .map(script => _.omitBy(script, (value, key) => key.includes('.phase')))
        .value()
    : [];
  return Object.assign({}, ...converted);
};

/**
 * @method convertParameters
 * @public
 * @description Handles converting portals and scripts from array based parameters to object key based
 * parameters to FileMaker required parameters.
 * @param  {Object|Array} data The raw data to use converting parameters
 * @return {Object|Array} A json object or array of objects without the properties passed to it
 */

const convertParameters = data =>
  Object.assign(convertPortals(data), stringify(convertScripts(data)), data);

/**
 * @method sanitizeParameters
 * @public
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
          convertParameters(parameters),
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
    : _.mapValues(convertParameters(parameters), value =>
        _.isNumber(value) ? value.toString() : value
      );

/**
 * @method parseScriptResults
 * @public
 * @description This method filters the FileMaker DAPI response by testing if a script was triggered
 * with the request, then either selecting the response, script error, and script result from the
 * response or selecting just the response.
 * @param  {Object} data The response recieved from the FileMaker DAPI.
 * @return {Object}      A json object containing the selected data from the Data API Response.
 */

const parseScriptResult = data =>
  _.mapValues(data.response, (value, property, object) =>
    property.includes('scriptResult')
      ? (object[property] = parse(value))
      : value
  );

/**
 * @method namespace
 * @public
 * @description The namespace method maps through an incoming data object's keys and replaces the properties
 * of limit, offset, and sort with their _ counterparts.
 * @param  {Object} data An object used in a DAPI query.
 * @return {Object}      A modified object containing modified keys to match expected properties
 */

const namespace = data =>
  _.mapKeys(data, (value, key) =>
    _.includes(['limit', 'offset', 'sort'], key) ? `_${key}` : key
  );

/**
 * @method setData
 * @public
 * @description The setData method checks the incoming data for a fieldData property. If
 * the fieldData property is not found it will create the property and add all properties
 * except portalData to this new property. It will also stringify any numbers or objects
 * in portalData's properties.
 * @param  {Object} data An object to use when creating or editing records.
 * @return {Object}      A modified object containing a fieldData property.
 */

const setData = data =>
  Object.assign(
    {},
    {
      fieldData: !_.has(data, 'fieldData')
        ? stringify(_.omit(data, 'portalData'))
        : stringify(data.fieldData)
    },
    _.has(data, 'portalData')
      ? {
          portalData: _.mapValues(data.portalData, data =>
            _.map(data, object => stringify(object))
          )
        }
      : {}
  );

module.exports = {
  namespace,
  parseScriptResult,
  sanitizeParameters,
  setData
};
