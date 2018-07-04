'use strict';

/**
 * The client's find method  will accept either a single object as find
 * parameters or an array. The find method will also santize the limit,
 * sort, and offset parameters to conform with the Data API's
 * requirements.
 */
const findRecords = client =>
  client
    .find('Heroes', [{ name: 'Anakin Skywalker' }], { limit: 1 })
    .then(response => client.recordId(response.data))
    .then(recordIds =>
      client.edit('Heroes', recordIds[0], { name: 'Darth Vader' })
    );

const finds = (client, examples) =>
  Promise.all([findRecords(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { finds };
