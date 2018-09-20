'use strict';

const _ = require('lodash');

/**
 * @method transformRelatedTables
 * @public
 * @description This method tranforms an object given by turning related tables into objects
 * @param  {Object} object The response recieved from the FileMaker DAPI.
 * @return {Object}      A json object containing the selected data from the Data API Response.
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
 * @method transformPortals
 * @public
 * @description this method transforms portals by mapping keys found in the portalData object into the
 * transformRelatedTables function. This method passes the parent portal key to properly transform
 * portal data related to the main portal table occurance.
 * @param  {Object} object The response recieved from the FileMaker DAPI.
 * @return {Object}      A json object containing the selected data from the Data API Response.
 */

const transformPortals = portals =>
  _.flatMap(portals, (values, key, collection) => {
    let portal = {};
    portal[key] = _.map(values, value => transformRelatedTables(value, key));
    return portal;
  });

/**
 * @method transformObject
 * @public
 * @description this method transforms portals by mapping keys found in the portalData object into the
 * transformRelatedTables function. This method passes the parent portal key to properly transform
 * portal data related to the main portal table occurance.
 * @param  {Object} object The response recieved from the FileMaker DAPI.
 * @param  {Object} options The response recieved from the FileMaker DAPI.
 * @return {Object}      A json object containing the selected data from the Data API Response.
 */

const transformObject = (object, options = {}) => {
  let { fieldData, portalData, recordId, modId } = object;
  let transformedFieldData =
    options.convert !== false ? transformRelatedTables(fieldData) : fieldData;
  let transformedPortalData =
    options.convert !== false ? transformPortals(portalData) : portalData;
  let portals =
    options.portalData !== false ? _.merge(...transformedPortalData) : {};
  let fields = options.fieldData !== false ? transformedFieldData : {};
  return Object.assign(fields, portals, { recordId, modId });
};

/**
 * @method transform
 * @public
 * @description this method transforms portals by mapping keys found in the portalData object into the
 * transformRelatedTables function. This method passes the parent portal key to properly transform
 * portal data related to the main portal table occurance.
 * @param  {Object} object The response recieved from the FileMaker DAPI.
 * @return {Object}      A json object containing the selected data from the Data API Response.
 */

const transform = (data, options) =>
  Array.isArray(data)
    ? _.map(data, object => transformObject(object, options))
    : transformObject(data, options);

module.exports = { transform };
