'use strict';

const { log, store } = require('./services');

//#edit-record-example
const editRecord = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.edit('Heroes', recordId, { name: 'Darth Vader' }))
    .then(result => log('edit-record-example', result));
//#

//#edit-record-merge-example
const editRecordMerge = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId =>
      client.edit('Heroes', recordId, { name: 'Darth Vader' }, { merge: true })
    )
    .then(result => log('edit-record-merge-example', result));
//#

const edits = (client, examples) =>
  Promise.all([editRecord(client), editRecordMerge(client)]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { edits };
