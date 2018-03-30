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
			 */
			application: {
				type: String,
				required: true
			},
			/**
			 * The client application server.
			 * @member Filemaker#server
			 */
			server: {
				type: String,
				required: true
			},
			/** The client application username.
			 * @member Filemaker#_username
			 */
			_username: {
				type: String,
				required: true
			},
			/** The client application password.
			 * @member Filemaker#_password
			 */
			_password: {
				type: String,
				required: true
			},
			/** The client application connection object.
			 * @member Filemaker#_connection
			 */
			_connection: {
				issued: {
					type: String
				},
				expires: {
					type: String
				},
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
