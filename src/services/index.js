'use strict';

const { fieldData, recordId, transform } = require('./transform.service');
const { containerData } = require('./container.service');
const {
  instance,
  interceptRequest,
  interceptResponse,
  interceptError
} = require('./request.service');
const { productInfo, databases } = require('./metadata.service');

module.exports = {
  interceptRequest,
  interceptResponse,
  interceptError,
  fieldData,
  recordId,
  transform,
  containerData,
  instance,
  productInfo,
  databases
};
