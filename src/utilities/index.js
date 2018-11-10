'use strict';

const {
  namespace,
  parseScriptResult,
  sanitizeParameters,
  setData
} = require('./filemaker.utilities');

const { omit, toStrings, toArray, isJson } = require('./conversion.utilities');

const {
  interceptRequest,
  handleResponseError
} = require('./request.utilities');

module.exports = {
  omit,
  toStrings,
  setData,
  toArray,
  isJson,
  namespace,
  parseScriptResult,
  sanitizeParameters,
  interceptRequest,
  handleResponseError
};
