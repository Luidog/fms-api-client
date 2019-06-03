'use strict';

const { log } = require('./services');

const duplicateHero = client =>
  client.find('Heroes', { name: 'yoda' }, { limit: 1 }).then(
    response =>
      //#duplicate-record-example
      client
        .duplicate('Heroes', response.data[0].recordId)
        .then(result => log('duplicate-record-example', result))
    //#
  );

const duplicate = (client, examples) =>
  Promise.all([duplicateHero(client)]).then(responses => client);

module.exports = { duplicate };
