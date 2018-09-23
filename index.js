'use strict';

const { Client, fieldData, recordId, transform } = require('./src');

/**
 * @module Filemaker
 */
module.exports = {
  Filemaker: Client,
  fieldData,
  recordId,
  transform
};
