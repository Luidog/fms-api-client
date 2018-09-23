'use strict';

const { log } = require('./services');

const getHero = client =>
  client.find('Heroes', { name: 'yoda' }, { limit: 1 }).then(
    response =>
      //#get-record-example
      client
        .get('Heroes', response.data[0].recordId)
        .then(result => log('get-record-example', result))
    //#
  );

const gets = (client, examples) =>
  Promise.all([getHero(client)]).then(responses => client);

module.exports = { gets };
