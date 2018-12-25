'use strict';

const {
  namespace,
  parseScriptResult,
  sanitizeParameters,
  setData
} = require('./filemaker.utilities');

const { omit, toStrings, toArray, isJson } = require('./conversion.utilities');

module.exports = {
  omit,
  toStrings,
  setData,
  toArray,
  isJson,
  namespace,
  parseScriptResult,
  sanitizeParameters
};
