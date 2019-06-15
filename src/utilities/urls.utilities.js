'use strict';

/** @class urls */

const urls = {
  /**
   * @function create
   * @memberof urls
   * @public
   * @description The create function generates a url for creating a new record.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when creating records.
   */

  create: (host, database, layout, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/records`,

  /**
   * @function update
   * @memberof urls
   * @public
   * @description The update function generates a url for updating a record.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} recordId The FileMaker internal record id to update.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when updating records.
   */

  update: (host, database, layout, recordId, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/records/${recordId}`,

  /**
   * @function delete
   * @memberof urls
   * @public
   * @description The delete funtion generates a url for  deleting a record.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} recordId The FileMaker internal record id to update.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when deleting records.
   */

  delete: (host, database, layout, recordId, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/records/${recordId}`,

  /**
   * @function get
   * @public
   * @memberOf urls
   * @description The get function generates a url to get a record's details.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} recordId The FileMaker internal record id to update.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to used when getting one record.
   */

  get: (host, database, layout, recordId, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/records/${recordId}`,

  /**
   * @function list
   * @public
   * @memberOf urls
   * @description The list function generates a url for listing records.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when listing records.
   */

  list: (host, database, layout, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/records`,

  /**
   * @function find
   * @public
   * @memberOf urls
   * @description The find function generates a url for performing a find request.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when performing a find.
   */

  find: (host, database, layout, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/_find`,

  /**
   * @function globals
   * @public
   * @memberOf urls
   * @description The global function generates a url for setting globals. Like FileMaker
   * globals, these values will only be set for the current session.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when setting globals
   */

  globals: (host, database, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/globals`,

  /**
   * @function logout
   * @memberOf urls
   * @public
   * @description The logout function generates a url for logging out of a FileMaker Session.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when logging out of a FileMaker DAPI session.
   */

  logout: (host, database, token, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/sessions/${token}`,

  /**
   * @function upload
   * @memberOf urls
   * @description The upload function generates a url for use when uploading files to FileMaker containers.
   * @public
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} recordId the record id to use when inserting the file.
   * @param {String} fieldName the field to use when inserting a file.
   * @param {String|Number} [fieldRepetition=1] The field repetition to use when inserting the file. The default is 1.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when uploading files to FileMaker.
   */

  upload: (
    host,
    database,
    layout,
    recordId,
    fieldName,
    fieldRepetition = 1,
    version = 'vLatest'
  ) =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/records/${recordId}/containers/${fieldName}/${fieldRepetition}`,

  /**
   * @function authentication
   * @memberOf urls
   * @public
   * @description The authentication function generates a url for retrieving authentication tokens.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to use when authenticating a FileMaker DAPI session.
   */

  authentication: (host, database, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/sessions`,

  /**
   * @function layouts
   * @memberOf urls
   * @public
   * @description The layouts function generates a url for retrieving database layouts.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL for retrieving database layouts.
   */

  layouts: (host, database, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts`,

  /**
   * @function layout
   * @memberOf urls
   * @public
   * @description The layout function generates a url for getting specific layout metadata.
   * in exchange for Account credentials.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL for retrieving specific layout metadata.
   */

  layout: (host, database, layout, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}`,

  /**
   * @function scripts
   * @memberOf urls
   * @public
   * @description The scripts function generates a url for listing database scripts.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL for listing datbase scripts
   */

  scripts: (host, database, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/scripts`,

  /**
   * @function duplicate
   * @memberOf urls
   * @public
   * @description The duplicate function generates a url for duplicating FileMaker records.
   * in exchange for Account credentials.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} recordId The FileMaker internal record id to duplicate.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} A URL to duplicate FileMaker records.
   */

  duplicate: (host, database, layout, recordId, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/records/${recordId}`,

  /**
   * @function productInfo
   * @memberOf urls
   * @public
   * @description The productInfo function generates a url for retrieving FileMaker Server metadata.
   * @param {String} host The host FileMaker server.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} The URL to use to retrieve FileMaker Server metadata.
   */

  productInfo: (host, version = 'vLatest') =>
    `${host}/fmi/data/${version}/productInfo`,

  /**
   * @function databases
   * @memberOf urls
   * @public
   * @description The databases function generates a url for retrieving FileMaker Server hosted databases.
   * @param {String} host The host FileMaker server.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} The URL to use to retrieve FileMaker Server hosted databases.
   */

  databases: (host, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases`,

  /**
   * @function script
   * @memberOf urls
   * @public
   * @description The script function generates a url for running a FileMaker script.
   * @param {String} host The host FileMaker server.
   * @param {String} database The FileMaker database to target.
   * @param {String} layout The database layout to use.
   * @param {String} script The name of the script to run .
   * @param {String|Object|Number} [parameter] Optional script parameters to pass to the called script.
   * @param {String} [version="vLatest"] The Data API version to use. The default is 'vLatest'.
   * @return {String} The URL to call a specific FileMaker script
   */

  script: (host, database, layout, script, parameter, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${database}/layouts/${layout}/script/${script}`
};

module.exports = { urls };
