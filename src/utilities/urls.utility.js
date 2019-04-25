'use strict';

const urls = {
  /**
   * @method create
   * @memberof Client
   * @public
   * @description Generates a url for use when creating a record.
   * @param {String} layout The layout to use when creating a record.
   * @return {String} A URL to use when creating records.
   */

  create: (host, application, layout, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}/records`,

  /**
   * @method update
   * @memberof Client
   * @public
   * @description Generates a url for use when updating a record.
   * @param {String} layout The layout to use when updating a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL to use when updating records.
   */

  update: (host, application, layout, recordId, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}/records/${recordId}`,

  /**
   * @method delete
   * @memberof Client
   * @public
   * @description Generates a url for use when deleting a record.
   * @param {String} layout The layout to use when creating a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL to use when deleting records.
   */

  delete: (host, application, layout, recordId, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}/records/${recordId}`,

  /**
   * @method get
   * @public
   * @memberOf Client
   * @description Generates a url to access a record.
   * @param {String} layout The layout to use when acessing a record.
   * @param {String} recordId The FileMaker internal record id to use.
   * @return {String} A URL to used when getting one record.
   */

  get: (host, application, layout, recordId, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}/records/${recordId}`,

  /**
   * @method list
   * @public
   * @memberOf Client
   * @descriptionGenerates a url for use when listing records.
   * @param {String} layout The layout to use when listing records.
   * @return {String} A URL to use when listing records.
   */

  list: (host, application, layout, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}/records`,

  /**
   * @method find
   * @public
   * @memberOf Client
   * @description Generates a url for use when performing a find request.
   * @param {String} layout The layout to use when listing records.
   * @return {String} A URL to use when performing a find.
   */

  find: (host, application, layout, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}/_find`,

  /**
   * @method globals
   * @public
   * @memberOf Client
   * @description Generates a url for use when setting globals. Like FileMaker
   * globals, these values will only be set for the current session.
   * @param {String} layout The layout to use when setting globals.
   * @return {String} A URL to use when setting globals
   */
  globals: (host, application, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/globals`,

  /**
   * @method logout
   * @memberof Client
   * @public
   * @description Generates a url for use when logging out of a FileMaker Session.
   * @return {String} A URL to use when logging out of a FileMaker DAPI session.
   */
  logout: (host, application, token, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/sessions/${token}`,

  /**
   * @method upload
   * @memberOf Client
   * @description Generates a url for use when uploading files to FileMaker containers.
   * @public
   * @param {String} layout The layout to use when setting globals.
   * @param {String} recordId the record id to use when inserting the file.
   * @param {String} fieldName the field to use when inserting a file.
   * @param {String} fieldRepetition The repetition to use when inserting the file.
   * default is 1.
   * @return {String} A URL to use when uploading files to FileMaker.
   */
  upload: (
    host,
    application,
    layout,
    recordId,
    fieldName,
    fieldRepetition = 1,
    version = 'vLatest'
  ) =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}/records/${recordId}/containers/${fieldName}/${fieldRepetition}`,

  /**
   * @method authentication
   * @memberof Client
   * @public
   * @description Generates a url for use when retrieving authentication tokens
   * in exchange for Account credentials.
   * @return {String} A URL to use when authenticating a FileMaker DAPI session.
   */
  authentication: (host, application, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/sessions`,

  /**
   * @method layoutsURL
   * @memberof Client
   * @public
   * @description Generates a url for use when retrieving authentication tokens
   * in exchange for Account credentials.
   * @return {String} A URL to use when authenticating a FileMaker DAPI session.
   */

  layouts: (host, application, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts`,

  /**
   * @method layout
   * @memberof Client
   * @public
   * @description Generates a url for use when retrieving authentication tokens
   * in exchange for Account credentials.
   * @param {String} layout The layout to use when getting metadata.
   * @return {String} A URL to use when authenticating a FileMaker DAPI session.
   */
  layout: (host, application, layout, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}`,

  /**
   * @method scripts
   * @memberof Client
   * @public
   * @description Generates a url for use when retrieving authentication tokens
   * in exchange for Account credentials.
   * @return {String} A URL to use when authenticating a FileMaker DAPI session.
   */

  scripts: (host, application, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/scripts`,

  /**
   * @method duplicate
   * @memberof Client
   * @public
   * @description Generates a url for use when retrieving authentication tokens
   * in exchange for Account credentials.
   * @param {String} layout The layout to use when duplicating the record.
   * @param {String} recordId the record id to duplicate.
   * @return {String} A URL to use when authenticating a FileMaker DAPI session.
   */
  duplicate: (host, application, layout, recordId, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases/${application}/layouts/${layout}/records/${recordId}`,
  /**
   * @method productInfo
   * @memberof Client
   * @public
   * @description Generates a url for retrieving FileMaker Server host metadata.
   * @return {String} The URL to use to retrieve FileMaker server host information.
   */
  productInfo: (host, version = 'vLatest') =>
    `${host}/fmi/data/${version}/productInfo`,

  /**
   * @method databases
   * @memberof Client
   * @public
   * @description Generates a url for retrieving FileMaker Server hosted databases.
   * @return {String} The URL to use to retrieve FileMaker Server hosted databases.
   */

  databases: (host, version = 'vLatest') =>
    `${host}/fmi/data/${version}/databases`
};

module.exports = { urls };