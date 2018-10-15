'use strict';

const {
  fieldData,
  recordId,
  namespace,
  parseScriptResult,
  sanitizeParameters,
  setFieldData
} = require('./filemaker.utilities');

const { omit, stringify, toArray, isJson } = require('./conversion.utilities');

const { transform } = require('./transform.utilities');

module.exports = {
  fieldData,
  omit,
  recordId,
  stringify,
  setFieldData,
  toArray,
  isJson,
  namespace,
  parseScriptResult,
  sanitizeParameters,
  transform
};
