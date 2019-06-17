'use strict';

const { fieldData, recordId, transform } = require('./transform.service');
const { containerData } = require('./container.service');
const { instance } = require('./request.service');
const { productInfo, databases } = require('./metadata.service');

module.exports = {
  fieldData,
  recordId,
  transform,
  containerData,
  instance,
  productInfo,
  databases
};
