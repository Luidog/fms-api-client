'use strict';

const moment = require('moment');
const { EmbeddedDocument } = require('marpat');

/**
 * @class Connection
 * @classdesc The class used to connection with the FileMaker server Data API
 */
class Connection extends EmbeddedDocument {
	/**
	 * Connection constructor.
	 * @constructs Connection
	 */
	constructor() {
		super();
		this.schema({
			/** A string containing the time the token token was issued.
			 * @memberof Connection#issued
			 * @type String
			 */
			issued: {
				type: String
			},
			/* A string containing the time the token will expire.
         * @memberof Connection#expires
         * @type String
		*/
			expires: {
				type: String
			},
			/** The token to use when querying an endpoint.
			 * @memberof Connection#token
			 * @type String
			 */
			token: {
				type: String
			}
		});
	}
	/**
	 * @method saveToken
	 * @public
	 * @memberof Connection
	 * @description Saves a token retrieved from the Data API.
	 * @params {String} token The token to save to the class instance.
	 * @return {String} a token retrieved from the private generation method
	 *
	 */
	saveToken(token) {
		this.expires = moment()
			.add(15, 'minutes')
			.format();
		this.issued = moment().format();
		this.token = token;
		return token;
	}
	/**
	 * @method extend
	 * @memberof Connection
	 * @public
	 * @description Saves a token retrieved from the Data API. This method returns the response recieved to it unmodified.
	 * @param {Object} response The response object.
	 * @return {Promise} the response recieved from the Data API.
	 *
	 */
	extend(response) {
		this.expires = moment(this.expires)
			.add(15, 'minutes')
			.format();

		return response;
	}
}
module.exports = {
	Connection
};
