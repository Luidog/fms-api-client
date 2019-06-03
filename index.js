'use strict';

const {
  Client,
  fieldData,
  recordId,
  transform,
  containerData,
  productInfo,
  databases
} = require('./src');

/**
 * @module Filemaker
 */
module.exports = {
  Filemaker: Client,
  fieldData,
  recordId,
  transform,
  containerData,
  productInfo,
  databases
};
