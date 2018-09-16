'use strict';

const { log } = require('./services');

//#delete-record-example
const deleteRecords = client =>
  client
    .find('Heroes', [{ name: 'Mace Windu' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.delete('Heroes', recordId))
    .then(result => log('delete-record-example', result));
//#

const revive = client => client.create('Heroes', { name: 'Mace Windu' });

const deletes = (client, examples) =>
  Promise.all([deleteRecords(client), revive(client)]).then(
    responses => client
  );

module.exports = { deletes };
