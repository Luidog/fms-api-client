'use strict';

const editRecords = client => true;

const edits = (client, examples) =>
  Promise.all([editRecords(client)]).then(responses => {
    examples.concat(responses);
    return client;
  });

module.exports = { edits };
