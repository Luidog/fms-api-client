'use strict';

//#delete-record-example
const deleteRecords = client =>
  client
    .find('Heroes', [{ name: 'Mace Windu' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId => client.delete('Heroes', recordId));
//#

const deletes = (client, examples) =>
  Promise.all([deleteRecords(client)]).then(responses => {
    examples.concat(responses);
    return client;
  });

module.exports = { deletes };
