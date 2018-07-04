'use strict';

const createRecord = client =>
  /**
   * Using the client you can create filemaker records. To create a record
   * specify the layout to use and the data to insert on creation. The client
   * will automatically convert numbers, arrays, and objects into strings so
   * they can be inserted into a filemaker field.
   *
   * The create method accepts the option of merge. If merge is true the data
   * used to create the with DAPI's response object on success
   */
  client.create('Heroes', {
    name: 'George Lucas'
  });

const mergeDataOnCreate = client =>
  /**
   * Using the client you can create filemaker records. To create a record
   * specify the layout to use and the data to insert on creation. The client
   * will automatically convert numbers, arrays, and objects into strings so
   * they can be inserted into a filemaker field.
   *
   * The create method accepts the option of merge. If merge is true the data
   * used to create the with DAPI's response object on success
   */
  client.create(
    'Heroes',
    {
      name: 'George Lucas'
    },
    { merge: true }
  );
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
