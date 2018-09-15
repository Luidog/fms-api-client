'use strict';

// #create-record-example
const createRecord = client =>
  client.create('Heroes', {
    name: 'George Lucas'
  });
// #

//#create-record-merge
const mergeDataOnCreate = client =>
  client.create(
    'Heroes',
    {
      name: 'George Lucas'
    },
    { merge: true }
  );
// #

//#create-many-records
const createManyRecords = client =>
  Promise.all([
    client.create('Heroes', { name: 'Anakin Skywalker' }, { merge: true }),
    client.create('Heroes', { name: 'Obi-Wan' }, { merge: true }),
    client.create('Heroes', { name: 'Yoda' }, { merge: true })
  ]);
//#

//#trigger-scripts-on-create
const triggerScriptsOnCreate = client =>
  client.create(
    'Heroes',
    { name: 'Anakin Skywalker' },
    {
      merge: true,
      scripts: [
        { name: 'Create Droids', param: { droids: ['C3-PO', 'R2-D2'] } }
      ]
    }
  );
//#
const creates = (client, examples) =>
  Promise.all([
    createRecord(client),
    mergeDataOnCreate(client),
    createManyRecords(client),
    triggerScriptsOnCreate(client)
  ])
    .then(responses => {
      examples.push(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { creates };
