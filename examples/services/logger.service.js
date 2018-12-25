'use strict';

const fse = require('fs-extra');
const path = require('path');
const deepMap = require('deep-map');

const toFile = file => path.resolve(__dirname, '../results', `${file}.json`);

const filter = values =>
  deepMap(values, (value, key) => {
    if (typeof value === 'string' && value.includes(process.env.SERVER)) {
      return value.replace(process.env.SERVER, 'https://some-server.com');
    } else if (key === 'recordId') {
      return '1138';
    } else if (key === 'modId') {
      return '327';
    } else if (key === 'modificationTimestamp' || key === 'creationTimestamp') {
      return '05/25/1977 6:00:00';
    } else if (key === 'id' || key === 'creationTimestamp') {
      return 'r2d2-c3po-l3-37-bb-8';
    } else {
      return value;
    }
  });

const log = (file, result) => {
  if (process.env.RESULTS) {
    fse.outputJson(toFile(file), filter(result), { spaces: 2 });
  }
  console.log(result);
  return result;
};

module.exports = { log };
