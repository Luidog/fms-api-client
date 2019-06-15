'use strict';

const {
  namespace,
  parseScriptResult,
  sanitizeParameters,
  setData
} = require('./filemaker.utilities');

const {
  omit,
  toStrings,
  toArray,
  deepMapKeys,
  isJSON,
  isEmpty
} = require('./conversion.utilities');

const { urls } = require('./urls.utilities');

module.exports = {
  omit,
  toStrings,
  setData,
  toArray,
  isJSON,
  isEmpty,
  deepMapKeys,
  namespace,
  parseScriptResult,
  sanitizeParameters,
  urls
};
