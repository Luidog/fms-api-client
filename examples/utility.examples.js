'use strict';

const { recordId, fieldData } = require('../index.js');

//#recordid-utility-example
const extractRecordId = client =>
  client
    .find('Heroes', { name: 'Luke Skywalker' })
    .then(response => recordId(response.data));
//#

//#fielddata-utility-example
const extractFieldData = client =>
  client
    .find('Heroes', { name: 'Luke Skywalker' })
    .then(response => fieldData(response.data));
//#

const utilities = (client, examples) =>
  Promise.all([extractFieldData(client), extractRecordId(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { utilities };
