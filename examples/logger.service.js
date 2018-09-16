'use strict';

const fse = require('fs-extra');
const path = require('path');

const log = (file, result) => {
  fse.outputJson(toFile(file), result, { spaces: 2 });
  return result;
};

const toFile = file => path.resolve(__dirname, 'results', `${file}.json`);

module.exports = { log };
