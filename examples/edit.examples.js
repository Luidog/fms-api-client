'use strict';

const editRecords = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(
      recordId =>
        //#edit-record-example
        client.edit('Heroes', recordId, { name: 'Darth Vader' })
      //#
    );

const edits = (client, examples) =>
  Promise.all([editRecords(client)]).then(responses => {
    examples.concat(responses);
    return client;
  });

module.exports = { edits };
