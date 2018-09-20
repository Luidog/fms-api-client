'use strict';

const { log } = require('./services');
const { recordId, fieldData, transform } = require('../index.js');

//#recordid-utility-example
const extractRecordId = client =>
  client
    .find('Heroes', { name: 'yoda' })
    .then(response => recordId(response.data))
    .then(result => log('recordid-utility-example', result));
//#

//#fielddata-utility-example
const extractFieldData = client =>
  client
    .find('Heroes', { name: 'yoda' })
    .then(response => fieldData(response.data))
    .then(result => log('fielddata-utility-example', result));
//#

//#fielddata-utility-example
const transformData = client =>
  client
    .find('Transform', { name: 'Han Solo' }, { limit: 1 })
    .then(result =>
      transform(result.data, { fieldData: false, portalData: false })
    )
    .then(result => log('transform-utility-example', result));
//#

const utilities = client =>
  Promise.all([
    extractFieldData(client),
    extractRecordId(client),
    transformData(client)
  ]).then(responses => client);

module.exports = { utilities };
