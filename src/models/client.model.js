'use strict';

const fs = require('fs');
const _ = require('lodash');
const FormData = require('form-data');
const intoStream = require('into-stream');
const { Document } = require('marpat');
const { Data } = require('./data.model');
const { Agent } = require('./agent.model');
const {
  toArray,
  namespace,
  isJSON,
  isEmpty,
  toStrings,
  sanitizeParameters,
  pick,
  parseScriptResult,
  setData,
  urls
} = require('../utilities');

const { productInfo, databases } = require('../services');

/**
 * @global
 */
global.FMS_API_CLIENT = {};

/**
 * @class Client
 * @classdesc The class used to integrate with the FileMaker server Data API
 */
class Client extends Document {
  /** @constructs */
  constructor() {
    super();
    this.schema({
      /**
       * A name for the client.
       * @member Client#name
       * @type String
       */
      name: {
        type: String
      },
      /** The client data logger.
       * @public
       * @member Client#data
       * @type Object
       */
      data: {
        type: Data,
        required: true
      },

      /** The client agent object.
       * @public
       * @member Client#agent
       * @type Object
       */
      agent: {
        type: Agent,
        required: true
      }
    });
  }
  /**
   * preInit is a hook
   * @schema
   * @description The client preInit hook  creates a data embedded document and a connection
   * embedded document on create.
   * @param {Object} data The data used to create the client.
   */
  preInit(data) {
    const {
      agent,
      timeout,
      concurrency,
      threshold,
      usage,
      proxy,
      convertLongNumbersToStrings,
      ...connection
    } = data;
    const protocol = data.server.startsWith('https') ? 'https' : 'http';
    this.data = Data.create({ track: usage === undefined });
    this.agent = Agent.create({
      agent,
      proxy,
      timeout,
      threshold,
      concurrency,
      protocol,
      convertLongNumbersToStrings,
      connection
    });
  }

  /**
   * preDelete is a hook
   * @schema
   * @description The client delete hook ensures a client attempts to log out before it is destroyed.
   * @param {Object} data The data used to create the client.
   * @return {null} The delete hook does not return anything.
   */
  preDelete() {
    return new Promise((resolve, reject) =>
      this.agent.connection
        .end()
        .then(response => resolve())
        .catch(error => resolve(error))
    );
  }

  /**
   * @method destroy
   * @memberof Client
   * @public
   * @description The destroy method is tied to the base model's
   * delete method method. This allows you to delete a client.
   * @see {@link https://github.com/luidog/marpat#deleting}
   * @return {Promise} returns a promise inherited by the clients bas class
   */
  destroy() {
    return super.delete();
  }

  /**
   * @method login
   * @memberof Client
   * @public
   * @description creates a session with the Data API and returns a token.
   * @see {@method Client#authenticate}
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.

   */
  login() {
    return new Promise((resolve, reject) =>
      this.agent.connection
        .start(!_.isEmpty(this.agent.agent) ? this.agent.localize() : false)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(resolve(body)))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method logout
   * @memberof Client
   * @public
   * @description logs out of the current authentication session and clears the saved token.
   * @param {String} [id] the connection id to logout.
   * @see {@method Connnection#end}
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  logout(id) {
    return new Promise((resolve, reject) =>
      this.agent.connection
        .end(!_.isEmpty(this.agent.agent) ? this.agent.localize() : false, id)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(resolve(body)))
        .catch(error => this._save(reject(error)))
    );
  }
  /**
   * @method productInfo
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server or FileMaker Cloud host.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  productInfo() {
    return new Promise((resolve, reject) =>
      productInfo(this.agent.connection.server, this.agent.connection.version)
        .then(response => resolve(response))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method status
   * @memberof Client
   * @public
   * @description Compiles Data API Client status information.
   * @return {Promise} returns a promise that will either resolve with client status information
   */
  status() {
    return new Promise((resolve, reject) =>
      resolve({
        ...this.data.status(),
        queue: this.agent.queue.map(({ url }) => ({ url })),
        pending: this.agent.pending.map(({ url }) => ({ url })),
        sessions: this.agent.connection.sessions.map(
          ({ issued, expires, id }) => ({
            issued,
            expires,
            id
          })
        )
      })
    );
  }

  /**
   * @method reset
   * @memberof Client
   * @public
   * @description Resets the client, clearing pending and queued requests and DAPI sessions.
   * @return {Promise} returns a promise that will either with a message object.
   */
  reset() {
    return new Promise((resolve, reject) => {
      const logouts = [];
      this.agent.queue = [];
      this.agent.pending = [];
      this.agent.connection.sessions.forEach(({ id }) =>
        logouts.push(this.logout(id))
      );
      Promise.all(logouts)
        .then(results => {
          return this.save();
        })
        .then(client =>
          resolve({
            message: 'Client Reset'
          })
        )
        .catch(error => reject({ message: 'Client Reset Failed' }));
    });
  }

  /**
   * @method databases
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @see Metadata Service#databases
   * @param {Object} [credentials] Credentials to use when listing server databases
   * @param {String} [credentials.user='configured user'] Credentials to use when listing server databases
   * @param {String} [credentials.password='configured password'] Credentials to use when listing server databases
   * @param {String} version The API version to use when gathering databases.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  databases(credentials, version) {
    return new Promise((resolve, reject) =>
      databases(
        this.agent.connection.server,
        credentials || this.agent.connection.credentials,
        this.agent.connection.version
      )
        .then(response => resolve(response))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method layouts
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @param {Object} [parameters] optional request parameters for the request.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  layouts(parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.layouts(
              this.agent.connection.server,
              this.agent.connection.database,
              this.agent.connection.version
            ),
            method: 'get'
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body => resolve(body.response))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method scripts
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @param {Object} [parameters] optional request parameters for the request.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  scripts(parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.scripts(
              this.agent.connection.server,
              this.agent.connection.database,
              this.agent.connection.version
            ),
            method: 'get'
          },
          parameters
        )

        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body => resolve(body.response))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method layout
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @param {String} layout The layout to use in the request.
   * @param {Object} [parameters] optional request parameters for the request.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  layout(layout, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.layout(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              this.agent.connection.version
            ),
            method: 'get',
            params: toStrings(sanitizeParameters(parameters, ['recordId']))
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body => resolve(body.response))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method duplicate
   * @memberof Client
   * @public
   * @description Retrieves information about the FileMaker Server's hosted databases.
   * @param {String} layout The layout to use in the request.
   * @param {String} recordId The record id to target for duplication.
   * @param {Object} [parameters] optional request parameters for the request.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  duplicate(layout, recordId, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.duplicate(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              recordId,
              this.agent.connection.version
            ),
            method: 'post',
            headers: {
              'Content-Type': 'application/json'
            },
            data: sanitizeParameters(parameters, [
              'script',
              'script.param',
              'script.prerequest',
              'script.prerequest.param',
              'script.presort',
              'script.presort.param',
              'request'
            ])
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body =>
          parseScriptResult(body, this.agent.convertLongNumbersToStrings)
        )
        .then(result => resolve(result))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method _save
   * @private
   * @memberof Client
   * @description Triggers a save and returns the response. This is responsible for ensuring the documents are up to date.
   * @param {Any} response The response data from the data api request.
   * @return {Any} Returns the umodified response.
   */
  _save(response) {
    this.save();
    return response;
  }

  /**
   * @method create
   * @public
   * @memberof Client
   * @description Creates a record in FileMaker. This method accepts a layout variable and a data variable.
   * @param {String} layout The layout to use when creating a record.
   * @param {Object} data The data to use when creating a record.
   * @param {Object} parameters The request parameters to use when creating the record.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  create(layout, data = {}, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.create(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              this.agent.connection.version
            ),
            method: 'post',
            headers: {
              'Content-Type': 'application/json'
            },
            data: Object.assign(
              sanitizeParameters(parameters, [
                'portalData',
                'script',
                'script.param',
                'script.prerequest',
                'script.prerequest.param',
                'script.presort',
                'script.presort.param',
                'request'
              ]),
              this.data.incoming(setData(data))
            )
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body =>
          parseScriptResult(body, this.agent.convertLongNumbersToStrings)
        )
        .then(response =>
          resolve(parameters.merge ? Object.assign(data, response) : response)
        )
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method edit
   * @public
   * @memberof Client
   * @description Edits a filemaker record.
   * @param {String} layout The layout to use when editing the record.
   * @param {String} recordId The FileMaker internal record ID to use when editing the record.
   * @param {Object} data The data to use when editing a record.
   * @param {Object} parameters parameters to use when performing the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  edit(layout, recordId, data, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.update(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              recordId,
              this.agent.connection.version
            ),
            method: 'patch',
            headers: {
              'Content-Type': 'application/json'
            },
            data: Object.assign(
              sanitizeParameters(parameters, [
                'portalData',
                'modId',
                'script',
                'script.param',
                'script.prerequest',
                'script.prerequest.param',
                'script.presort',
                'script.presort.param',
                'request'
              ]),
              this.data.incoming(setData(data))
            )
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body =>
          parseScriptResult(body, this.agent.convertLongNumbersToStrings)
        )
        .then(body =>
          resolve(
            parameters.merge
              ? Object.assign(data, { recordId: recordId }, body)
              : body
          )
        )
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method delete
   * @public
   * @memberof Client
   * @description Deletes a filemaker record.
   * @param {String} layout The layout to use when deleting the record.
   * @param {String} recordId The FileMaker internal record ID to use when editing the record.
   * @param {Object} parameters parameters to use when performing the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  delete(layout, recordId, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.delete(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              recordId,
              this.agent.connection.version
            ),
            method: 'delete',
            data: sanitizeParameters(parameters, [
              'script',
              'script.param',
              'script.prerequest',
              'script.prerequest.param',
              'script.presort',
              'script.presort.param',
              'request'
            ])
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body =>
          parseScriptResult(body, this.agent.convertLongNumbersToStrings)
        )
        .then(result => resolve(result))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method get
   * @public
   * @memberof Client
   * @description Retrieves a filemaker record based upon the layout and recordId.
   * @param {String} layout The layout to use when retrieving the record.
   * @param {String} recordId The FileMaker internal record ID to use when retrieving the record.
   * @param {Object} [parameters] Parameters to add for the get query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  get(layout, recordId, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.get(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              recordId,
              this.agent.connection.version
            ),
            method: 'get',
            params: toStrings(
              sanitizeParameters(namespace(parameters), [
                'script',
                'script.param',
                'script.prerequest',
                'script.prerequest.param',
                'script.presort',
                'script.presort.param',
                'layout.response',
                'portal',
                '_offset.*',
                '_limit.*',
                'request'
              ])
            )
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body =>
          parseScriptResult(body, this.agent.convertLongNumbersToStrings)
        )
        .then(result => resolve(result))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method list
   * @public
   * @memberof Client
   * @description Retrieves a list of FileMaker records based upon a layout.
   * @param {String} layout The layout to use when retrieving the record.
   * @param {Object} [parameters] the parameters to use to modify the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  list(layout, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.list(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              this.agent.connection.version
            ),
            method: 'get',
            headers: {
              'Content-Type': 'application/json'
            },
            params: toStrings(
              sanitizeParameters(namespace(parameters), [
                '_limit',
                '_offset',
                '_sort',
                'portal',
                'script',
                'script.param',
                'script.prerequest',
                'script.prerequest.param',
                'script.presort',
                'script.presort.param',
                'layout.response',
                '_offset.*',
                '_limit.*',
                'request'
              ])
            )
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body =>
          parseScriptResult(body, this.agent.convertLongNumbersToStrings)
        )
        .then(result => resolve(result))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method find
   * @public
   * @memberof Client
   * @description performs a FileMaker find.
   * @param {String} layout The layout to use when performing the find.
   * @param {Object} query to use in the find request.
   * @param {Object} parameters the parameters to use to modify the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  find(layout, query, parameters = {}) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.find(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              this.agent.connection.version
            ),
            method: 'post',
            headers: {
              'Content-Type': 'application/json'
            },
            data: Object.assign(
              { query: toStrings(toArray(query)) },
              sanitizeParameters(parameters, [
                'limit',
                'sort',
                'offset',
                'portal',
                'script',
                'script.param',
                'script.prerequest',
                'script.prerequest.param',
                'script.presort',
                'script.presort.param',
                'layout.response',
                'offset.*',
                'limit.*',
                'request'
              ])
            )
          },
          parameters
        )

        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body =>
          parseScriptResult(body, this.agent.convertLongNumbersToStrings)
        )
        .then(result => resolve(result))
        .catch(error => {
          this._save();
          return error.code === '401'
            ? resolve({
                data: [],
                message: 'No records match the request'
              })
            : reject(error);
        })
    );
  }

  /**
   * @method globals
   * @public
   * @memberof Client
   * @description Sets global fields for the current session.
   * @param  {Object|Array} data a json object containing the name value pairs to set.
   * @param {Object} parameters parameters to use when performing the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  globals(data, parameters) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.globals(
              this.agent.connection.server,
              this.agent.connection.database,
              this.agent.connection.version
            ),
            method: 'patch',
            headers: {
              'Content-Type': 'application/json'
            },
            data: { globalFields: toStrings(data) }
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(result => resolve(result))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method upload
   * @public
   * @memberof Client
   * @description Allows you to upload a file to a FileMaker record container field. This method
   * currently creates a record for each upload. This method will use fs to read the file at the given
   * path to a stream. If a record Id is not passed to this method a new record will be created.
   * @param  {String} file               The path to the file to upload.
   * @param {String} layout The layout to use when performing the find.
   * @param  {String} containerFieldName The field name to insert the data into. It must be a container field.
   * @param  {Number|String} recordId the recordId to use when uploading the file.
   * @param {Object} parameters parameters to use when performing the query.
   * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
   */
  upload(file, layout, containerFieldName, recordId = 0, parameters = {}) {
    return new Promise((resolve, reject) => {
      let stream;
      const form = new FormData();
      const resolveRecordId = () =>
        recordId === 0
          ? this.create(layout, {}).then(response => response.recordId)
          : Promise.resolve(recordId);

      if (typeof file === 'string') {
        stream = fs.createReadStream(file);
        stream.on('error', error =>
          reject({ message: error.message, code: error.code })
        );
      } else if (!file || !file.name || !file.buffer) {
        reject({
          message: 'A file object must have a name and buffer property',
          code: 117
        });
      } else {
        stream = intoStream(file.buffer);
        stream.name = file.name;
      }

      form.append('upload', stream);
      resolveRecordId()
        .then(resolvedId =>
          this.agent
            .request(
              {
                url: urls.upload(
                  this.agent.connection.server,
                  this.agent.connection.database,
                  layout,
                  resolvedId,
                  containerFieldName,
                  parameters.fieldRepetition,
                  this.agent.connection.version
                ),
                method: 'post',
                data: form,
                headers: {
                  ...form.getHeaders()
                }
              },
              parameters
            )
            .then(response => response.data)
            .then(body => this.data.outgoing(body))
            .then(body => this._save(body))
            .then(body =>
              parseScriptResult(body, this.agent.convertLongNumbersToStrings)
            )
            .then(response => Object.assign(response, { recordId: resolvedId }))
        )
        .then(response => resolve(response))
        .catch(error => this._save(reject(error)));
    });
  }

  /**
   * @method run
   * @public
   * @memberof Client
   * @description A public method to make triggering a script easier. This method uses the list method with
   * a limit of 1. This is the lightest weight query possible while still allowing for a script to be triggered.
   * For a more robust query with scripts use the find method.
   * @param  {String} layout     The layout to use for the list request
   * @param  {Object|Array} scripts       The name of the script
   * @param  {Object} parameters Parameters to pass to the script
   * @param  {Object} request A request to run alongside the list method.
   * @return {Promise}           returns a promise that will either resolve or reject based on the Data API.
   */
  run(layout, scripts, parameters, request) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.list(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              this.agent.connection.version
            ),
            method: 'get',
            headers: {
              'Content-Type': 'application/json'
            },
            params: sanitizeParameters(
              Object.assign(
                Array.isArray(scripts)
                  ? { scripts }
                  : isJSON(scripts)
                  ? { scripts: [scripts] }
                  : { script: scripts },
                typeof scripts === 'string' && typeof parameters !== 'undefined'
                  ? { 'script.param': parameters }
                  : {},
                namespace({ limit: 1 })
              ),
              [
                'script',
                'script.param',
                'script.prerequest',
                'script.prerequest.param',
                'script.presort',
                'script.presort.param',
                '_limit'
              ]
            )
          },
          typeof scripts === 'string' && typeof parameters !== 'undefined'
            ? request
            : parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body =>
          pick(
            parseScriptResult(body, this.agent.convertLongNumbersToStrings),
            'scriptResult'
          )
        )
        .then(result => resolve(result))
        .catch(error => this._save(reject(error)))
    );
  }

  /**
   * @method script
   * @public
   * @memberof Client
   * @description A public method to make triggering a script easier.
   * @param  {String} layout The layout to use for the list request
   * @param  {String} script The name of the script
   * @param  {Object|String} param Parameter  to pass to the script
   * @param  {Object} [parameters] Optional request parameters.
   * @return {Promise}      returns a promise that will either resolve or reject based on the Data API.
   */
  script(layout, script, param = {}, parameters) {
    return new Promise((resolve, reject) =>
      this.agent
        .request(
          {
            url: urls.script(
              this.agent.connection.server,
              this.agent.connection.database,
              layout,
              script,
              this.agent.connection.version
            ),
            method: 'get',
            headers: {
              'Content-Type': 'application/json'
            },
            params: !isEmpty(param)
              ? {
                  'script.param': isJSON(param)
                    ? JSON.stringify(param)
                    : param.toString()
                }
              : param
          },
          parameters
        )
        .then(response => response.data)
        .then(body => this.data.outgoing(body))
        .then(body => this._save(body))
        .then(body => ({
          ...body.response,
          scriptResult: isJSON(body.response.scriptResult)
            ? JSON.parse(body.response.scriptResult)
            : body.response.scriptResult
        }))
        .then(result => resolve(result))
        .catch(error => this._save(reject(error)))
    );
  }
}

module.exports = {
  Client
};
