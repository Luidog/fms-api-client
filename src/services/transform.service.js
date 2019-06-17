'use strict';

const _ = require('lodash');

/**
 * @class Transformation Service
 */

/**
 * @function transformRelatedTables
 * @public
 * @memberof Transformation Service
 * @description This function tranforms an object given by turning related tables into objects
 * @param  {Object} object The response recieved from the FileMaker DAPI.
 * @return {Object}      A JSON object containing the selected data from the Data API Response.
 */

const transformRelatedTables = (object, parentKey) =>
  _.transform(
    object,
    (accumulator, value, key) => {
      if (key.includes('::')) {
        let position = key.indexOf('::');
        let parent = _.camelCase(parentKey);
        let table = _.camelCase(key.slice(0, position));
        let field = _.camelCase(key.slice(position + 2));
        if (!accumulator.hasOwnProperty(table) && table !== parent) {
          accumulator[table] = {};
        }
        table !== parent
          ? (accumulator[table][field] = value)
          : (accumulator[field] = value);
      } else {
        accumulator[key] = value;
      }
    },
    {}
  );

/**
 * @function transformPortals
 * @private
 * @memberof Transformation Service
 * @description this function transforms portals by mapping keys found in the portalData object into the
 * transformRelatedTables function. This function passes the parent portal key to properly transform
 * portal data related to the main portal table occurance.
 * @param  {Object} object The response recieved from the FileMaker DAPI.
 * @return {Object}      A JSON object containing the selected data from the Data API Response.
 */

const transformPortals = portals =>
  _.flatMap(portals, (values, key, collection) => {
    let portal = {};
    portal[key] = _.map(values, value => transformRelatedTables(value, key));
    return portal;
  });

/**
 * @function transformObject
 * @private
 * @memberof Transformation Service
 * @description this function transforms portals by mapping keys found in the portalData object into the
 * transformRelatedTables function. This function passes the parent portal key to properly transform
 * portal data related to the main portal table occurance.
 * @param  {Object} object The response recieved from the FileMaker DAPI.
 * @param  {Object} options The response recieved from the FileMaker DAPI.
 * @return {Object}      A JSON object containing the selected data from the Data API Response.
 */

const transformObject = (object, options = {}) => {
  let { fieldData, portalData, recordId, modId } = object;
  let transformedFieldData =
    options.convert !== false ? transformRelatedTables(fieldData) : fieldData;
  let transformedPortalData =
    options.convert !== false
      ? _.merge(...transformPortals(portalData))
      : portalData;
  let portals = options.portalData !== false ? transformedPortalData : {};
  let fields = options.fieldData !== false ? transformedFieldData : {};
  return Object.assign(fields, portals, { recordId, modId });
};

/**
 * @function fieldData
 * @public
 * @memberof Transformation Service
 * @description fieldData is a helper function that strips the filemaker structural layout and portal information
 * from a record. It returns only the data contained in the fieldData key and the recordId.
 * @param  {Object|Array} data The raw data returned from a filemaker. This can be an array or an object.
 * @return {Object|Array} A JSON object containing fieldData from the record.
 */

const fieldData = data =>
  Array.isArray(data)
    ? _.map(data, object =>
        Object.assign({}, object.fieldData, {
          recordId: object.recordId,
          modId: object.modId
        })
      )
    : Object.assign(data.fieldData, {
        recordId: data.recordId,
        modId: data.modId
      });

/**
 * @function recordId
 * @public
 * @memberof Transformation Service
 * @description returns record ids for the data parameters passed to it. This can be an array of ids or an object.
 * from a record. It returns only the data contained in the fieldData key adn the recordId.
 * @param  {Object|Array} data the raw data returned from a filemaker. This can be an array or an object.
 * @return {Object}      a JSON object containing fieldData from the record.
 */

const recordId = data =>
  Array.isArray(data)
    ? _.map(data, object => object.recordId)
    : data.recordId.toString();

/**
 * @function transform
 * @public
 * @memberof Transformation Service
 * @description this function transforms portals by mapping keys found in the portalData object into the
 * transformRelatedTables function. This function passes the parent portal key to properly transform
 * portal data related to the main portal table occurance.
 * @param  {Object} object The response recieved from the FileMaker DAPI.
 * @return {Object}      A JSON object containing the selected data from the Data API Response.
 */

const transform = (data, options) =>
  Array.isArray(data)
    ? _.map(data, object => transformObject(object, options))
    : transformObject(data, options);

module.exports = { recordId, fieldData, transform };
