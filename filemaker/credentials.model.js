'use strict';

const moment = require('moment');
const { EmbeddedDocument } = require('marpat');

/**
 * @class Credentials
 * @classdesc The class used to authenticate with into the FileMaker API.
 */
class Credentials extends EmbeddedDocument {
	/**
	 * Credentials constructor.
	 * @constructs Credentials
	 */
	constructor() {
		super();
		this.schema({
			/** A string containing the time the token token was issued.
			 * @memberof Credentials#password
			 * @type String
			 */
			password: {
				type: String
			},
			/** A string containing the time the token will expire.
			 * @memberof Credentials#layout
			 * @type String
			 */
			layout: {
				type: String
			},
			/** The token to use when querying an endpoint.
			 * @memberof Credentials#user
			 * @type String
			 */
			user: {
				type: String
			}
		});
	}
}
module.exports = {
	Credentials
};
