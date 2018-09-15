'use strict';

// #create-record-example
const createRecord = client =>
  client.create('Heroes', {
    name: 'George Lucas'
  });
// #

// #create-record-merge
const mergeDataOnCreate = client =>
  client.create(
    'Heroes',
    {
      name: 'George Lucas'
    },
    { merge: true }
  );
// #

/**
 * Most methods on the client are promises. The only exceptions to this are
 * the utility methods of fieldData(), and recordId(). You can chain together
 * multiple methods such as record creation.
 */

const createManyRecords = client =>
  Promise.all([
    client.create('Heroes', { name: 'Anakin Skywalker' }, { merge: true }),
    client.create('Heroes', { name: 'Obi-Wan' }, { merge: true }),
    client.create('Heroes', { name: 'Yoda' }, { merge: true })
  ]);

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
