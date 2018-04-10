'use strict';

const moment = require('moment');
const request = require('request-promise');
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
			 * @member Connection#issued
			 * @type String
			 */
			issued: {
				type: String
			},
			/* A string containing the time the token will expire.
             * @member Connection#expires
             * @type String
		     */
			expires: {
				type: String
			},
			/** The token to use when querying an endpoint.
			 * @member Connection#token
			 * @type String
			 */
			token: {
				type: String
			}
		});
	}
	/**
	 * @method _saveToken
	 * @public
	 * @memberof Connection
	 * @description Saves a token retrieved from the Data API.
	 * @params {String} token The token to save to the class instance.
	 * @return {String} a token retrieved from the private generation method
	 *
	 */
	_saveToken(token) {
		this.expires = moment()
			.add(15, 'minutes')
			.format();
		this.issued = moment().format();
		this.token = token;
		return token;
	}
	/**
	 * @method valid
	 * @public
	 * @memberof Connection
	 * @description Saves a token retrieved from the Data API.
	 * @params {String} token The token to save to the class instance.
	 * @return {String} a token retrieved from the private generation method
	 *
	 */
	valid() {
		return (
			this.token !== undefined &&
			moment().isBetween(this.issued, this.expires, '()')
		);
	}
	/**
	 * @method generate
	 * @memberof Connection
	 * @public
	 * @description Retrieves an authentication token from the Data API. This promise method will check for
	 * a zero string in the response errorCode before resolving. If an http error code or a non zero response error code.
	 * is returned this will reject.
	 * @return {Promise} returns a promise that will either resolve or reject based on the Data API.
	 * response
	 */
	generate(url, body) {
		return new Promise((resolve, reject) =>
			request({
				url: url,
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: body,
				json: true
			}).then(response => {
				if (response.errorCode === '0') {
					this._saveToken(response.token);
					resolve(response.token);
				} else {
					reject(response.errorMessage);
				}
			})
		);
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
