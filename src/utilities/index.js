'use strict';

const {
  namespace,
  parseScriptResult,
  sanitizeParameters,
  setData
} = require('./filemaker.utilities');

const { omit, stringify, toArray, isJson } = require('./conversion.utilities');

const {
  interceptRequest,
  handleResponseError
} = require('./request.utilities');

module.exports = {
  omit,
  stringify,
  setData,
  toArray,
  isJson,
  namespace,
  parseScriptResult,
  sanitizeParameters,
  interceptRequest,
  handleResponseError
};
