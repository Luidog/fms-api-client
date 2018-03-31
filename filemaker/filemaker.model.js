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
			 * @member Filemaker#_username
			 * @type String
			 */
			_username: {
				type: String,
				required: true
			},
			/** The client application password.
			 * @member Filemaker#_password
			 * @type String
			 */
			_password: {
				type: String,
				required: true
			},
			/** The client application connection object.
			 * @member Filemaker#_connection
			 * @type Object
			 */
			_connection: {
			/** A string containing the time the token token was issued.
			 * @memberof _connection
			 * @type String
			 */
				issued: {
					type: String
				},
			/** A string containing the time the token will expire.
			 * @memberof _connection
			 * @type String
			 */
				expires: {
					type: String
				},
			/** The token to use when querying an endpoint.
			 * @memberof _connection
			 * @type String
			 */
				token: {
					type: String
				}
			}
		});
	}
}

module.exports = {
	Filemaker
};
