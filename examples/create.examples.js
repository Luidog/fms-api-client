'use strict';

const { log, store } = require('./services');

// #create-record-example
const createRecord = client =>
  client
    .create('Heroes', {
      name: 'George Lucas'
    })
    .then(result => log('create-record', result));
// #

//#create-record-merge
const mergeDataOnCreate = client =>
  client
    .create(
      'Heroes',
      {
        name: 'George Lucas'
      },
      { merge: true }
    )
    .then(result => log('create-record-merge', result));
// #

//#create-many-records
const createManyRecords = client =>
  Promise.all([
    client.create('Heroes', { name: 'Anakin Skywalker' }, { merge: true }),
    client.create('Heroes', { name: 'Obi-Wan' }, { merge: true }),
    client.create('Heroes', { name: 'Yoda' }, { merge: true })
  ]).then(result => log('create-many-records', result));
//#

//#trigger-scripts-on-create
const triggerScriptsOnCreate = client =>
  client
    .create(
      'Heroes',
      { name: 'Anakin Skywalker' },
      {
        merge: true,
        scripts: [
          { name: 'Create Droids', param: { droids: ['C3-PO', 'R2-D2'] } }
        ]
      }
    )
    .then(result => log('trigger-scripts-on-create', result));
//#
const creates = (client, examples) =>
  Promise.all([
    createRecord(client),
    mergeDataOnCreate(client),
    createManyRecords(client),
    triggerScriptsOnCreate(client)
  ]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { creates };
