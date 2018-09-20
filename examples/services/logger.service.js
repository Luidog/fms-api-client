'use strict';

const fse = require('fs-extra');
const path = require('path');
const deepMap = require('deep-map');

const toFile = file => path.resolve(__dirname, '../results', `${file}.json`);

const filter = values =>
  deepMap(
    values,
    value =>
      typeof value === 'string' && value.includes(process.env.SERVER)
        ? value.replace(process.env.SERVER, 'https://some-server.com')
        : value
  );

const log = (file, result) => {
  if (process.env.RESULTS) {
    fse.outputJson(toFile(file), filter(result), { spaces: 2 });
  }
  console.log(result)
  return result;
};

module.exports = { log };
