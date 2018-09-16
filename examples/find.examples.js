'use strict';

const { log } = require('./services');

//#find-records-example
const findRecords = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(result => log('find-records-example', result));
//#

const finds = client =>
  Promise.all([findRecords(client)]).then(responses => client);

module.exports = { finds };
