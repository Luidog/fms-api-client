'use strict';

const {
  fieldData,
  recordId,
  namespace,
  parseScriptResult,
  sanitizeParameters,
  setData
} = require('./filemaker.utilities');

const { omit, stringify, toArray, isJson } = require('./conversion.utilities');

const { transform } = require('./transform.utilities');

const {
  interceptRequest,
  handleResponseError
} = require('./request.utilities');

module.exports = {
  fieldData,
  omit,
  recordId,
  stringify,
  setData,
  toArray,
  isJson,
  namespace,
  parseScriptResult,
  sanitizeParameters,
  interceptRequest,
  handleResponseError,
  transform
};
