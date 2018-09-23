'use strict';

const { log } = require('./services');

//#list-records-example
const listHeroes = client =>
  client
    .list('Heroes', { limit: 2 })
    .then(result => log('list-records-example', result));
//#

const lists = (client, examples) =>
  Promise.all([listHeroes(client)]).then(responses => client);

module.exports = { lists };
