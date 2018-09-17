'use strict';

const { log, store } = require('./services');

//#edit-record-example
const editRecords = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.edit('Heroes', recordId, { name: 'Darth Vader' }))
    .then(result => log('edit-record-example', result));
//#

const edits = (client, examples) =>
  Promise.all([editRecords(client)]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { edits };
