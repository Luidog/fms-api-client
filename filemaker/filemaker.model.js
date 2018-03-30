'use strict';

const { Document } = require('marpat');

class Filemaker extends Document {
	constructor() {
		super();

		this.schema({
			message: {
				type: String,
				required: true,
				default: 'Coming Soon'
			}
		});
	}
}

module.exports = {
	Filemaker
};
