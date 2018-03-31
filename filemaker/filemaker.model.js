'use strict';

const { Document } = require('marpat');
/**
 * @class Filemaker
 * @classdesc The class used to integrate with the FileMaker server Data API
 */
class Filemaker extends Document {
	/**
	 * FileMaker constructor.
	 * @constructs Filemaker
	 */
	constructor() {
		super();

		this.schema({
			/**
			 * The client application name.
			 * @member Filemaker#application
			 * @type String
			 */
			application: {
				type: String,
				required: true
			},
			/**
			 * The client application server.
			 * @member Filemaker#server
			 * @type String
			 */
			server: {
				type: String,
				required: true
			},
			/** The client application username.
			 * @private
			 * @member Filemaker#_username
			 * @type String
			 */
			_username: {
				type: String,
				required: true
			},
			/** The client application password.
			 * @private
			 * @member Filemaker#_password
			 * @type String
			 */
			_password: {
				type: String,
				required: true
			},
			/** The client application connection object.
			 * @private
			 * @member Filemaker#_connection
			 * @type Object
			 */
			_connection: {
				/** A string containing the time the token token was issued.
				 * @memberof Filemaker#_connection
				 * @type String
				 */
				issued: {
					type: String
				},
				/** A string containing the time the token will expire.
				 * @memberof Filemaker#_connection
				 * @type String
				 */
				expires: {
					type: String
				},
				/** The token to use when querying an endpoint.
				 * @memberof Filemaker#_connection
				 * @type String
				 */
				token: {
					type: String
				}
			}
		});
	}
	/**
	 * Generates a url for use when retrieving authentication tokens in exchange for Account credentials
	 * @private
	 * @return {String} A URL
	 */
	_authURL() {
		let url = `${this.server}/fmi/rest/api/auth/${this.application}`;
		return url;
	}
	/**
	 * Generates a url for use when creating a record.
	 * @private
	 * @param {String} layout The layout to use when creating a record.
	 * @return {String} A URL
	 */
	_createURL(layout) {
		let url = `${this.server}/fmi/rest/api/record/${
			this.application
		}/${layout}`;
		return url;
	}
	/**
	 * Generates a url for use when deleting a record.
	 * @private
	 * @param {String} layout The layout to use when creating a record.
	 * @param {String} recordId The FileMaker internal record id to use.
	 * @return {String} A URL
	 */
	_deleteURL(layout, recordId) {
		let url = `${this.server}/fmi/rest/api/record/${
			this.application
		}/${layout}/${recordId}`;
		return url;
	}
	/**
	 * Generates a url for use when updating a record.
	 * @private
	 * @param {String} layout The layout to use when updating a record.
	 * @param {String} recordId The FileMaker internal record id to use.
	 * @return {String} A URL
	 */
	_updateURL(layout, recordId) {
		let url = `${this.server}/fmi/rest/api/record/${
			this.application
		}/${layout}/${recordId}`;
		return url;
	}
	/**
	 * Generates a url to access a record.
	 * @private
	 * @param {String} layout The layout to use when acessing a record.
	 * @param {String} recordId The FileMaker internal record id to use.
	 * @return {String} A URL
	 */
	_getURL(layout, recordId) {
		let url = `${this.server}/fmi/rest/api/record/${
			this.application
		}/${layout}/${recordId}`;
		return url;
	}
	/**
	 * Generates a url for use when listing records.
	 * @private
	 * @param {String} layout The layout to use when listing records.
	 * @return {String} A URL
	 */
	_listURL(layout) {
		let url = `${this.server}/fmi/rest/api/record/${
			this.application
		}/${layout}`;
		return url;
	}
	/**
	 * Generates a url for use when performing a find request.
	 * @private
	 * @param {String} layout The layout to use when listing records.
	 * @return {String} A URL
	 */
	_findURL(layout) {
		let url = `${this.server}/fmi/rest/api/find/${
			this.application
		}/${layout}`;
		return url;
	}
	/**
	 * Generates a url for use when setting globals.
	 * @private
	 * @param {String} layout The layout to use when setting globals.
	 * @return {String} A URL
	 */
	_globalsURL() {
		let url = `${this.server}/fmi/rest/api/global/${this.application}/${
			this._layout
		}`;
		return url;
	}
	/**
	 * Retrieves an authentication token from the Data API. This promise method will check for
	 * a zero errorCode before resolving. If a http error code or a non zero response error code
	 * is returned this promise method will reject.
	 * @return {Promise} returns a promise that will either resolve or reject based on the Data API
	 * response
	 */
	_generateToken() {
		return new Promise((resolve, reject) => {
			request({
				url: this._authURL(),
				method: 'post',
				headers: {
					Authorization: this._basicAuth(),
					'Content-Type': 'application/json'
				},
				body: {
					user: this._username,
					password: this._password,
					layout: this._layout
				},
				json: true
			})
				.then(response => {
					if (response.errorCode === '0') {
						resolve(response.token);
					} else {
						reject(response.body);
					}
					saveToken(response.token);
					resolve(response.token);
				})
				.catch(error => reject(error));
		});
	}
}

module.exports = {
	Filemaker
};
