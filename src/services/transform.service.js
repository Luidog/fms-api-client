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
 * @param  {String} parentKey The response recieved from the FileMaker DAPI.
 * @param  {Object} options Options object to modify how this function performs.
 * @return {Object}      A JSON object containing the selected data from the Data API Response.
 */
const transformRelatedTables = (object, parentKey) =>
  _.transform(
    object,
    (accumulator, value, key) => {
      if (key.includes('::')) {
        const position = key.indexOf('::');
        const parent = parentKey;
        const table = key.slice(0, position);
        const field = key.slice(position + 2);
        if (
          !Object.prototype.hasOwnProperty.call(accumulator, table) &&
          table !== parent
        ) {
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
 * @param  {Object} portals The response recieved from the FileMaker DAPI.
 * @return {Object}      A JSON object containing the selected data from the Data API Response.
 */
const transformPortals = portals =>
  _.flatMap(portals, (values, key, collection) => {
    const portal = {};
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
  const { fieldData, portalData, recordId, modId } = object;
  const transformedFieldData =
    options.convert !== false ? transformRelatedTables(fieldData) : fieldData;
  const transformedPortalData =
    options.convert !== false
      ? _.merge(...transformPortals(portalData))
      : portalData;
  const portals = options.portalData !== false ? transformedPortalData : {};
  const fields = options.fieldData !== false ? transformedFieldData : {};
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
 * @param  {Object} data The data to transform.
 * @param  {Object} options transformation options to pass to transformObject.
 * @return {Object}      A JSON object containing the selected data from the Data API Response.
 * @see transformObject
 */
const transform = (data, options) =>
  Array.isArray(data)
    ? _.map(data, object => transformObject(object, options))
    : transformObject(data, options);

module.exports = { recordId, fieldData, transform };
