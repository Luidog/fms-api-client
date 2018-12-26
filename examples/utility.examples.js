'use strict';

const { log } = require('./services');
const {
  recordId,
  fieldData,
  transform,
  containerData
} = require('../index.js');

//#recordid-utility-example
const extractRecordId = client =>
  client
    .find('Heroes', { name: 'yoda' }, { limit: 2 })
    .then(response => recordId(response.data))
    .then(result => log('recordid-utility-example', result));
//#

//#fielddata-utility-example
const extractFieldData = client =>
  client
    .find('Heroes', { name: 'yoda' }, { limit: 2 })
    .then(response => fieldData(response.data))
    .then(result => log('fielddata-utility-example', result));
//#

//#transform-utility-example
const transformData = client =>
  client
    .find('Transform', { name: 'Han Solo' }, { limit: 1 })
    .then(result => transform(result.data))
    .then(result => log('transform-utility-example', result));
//#

//#transform-utility-no-convert-example
const transformDataNoConvert = client =>
  client
    .find('Transform', { name: 'Han Solo' }, { limit: 1 })
    .then(result => transform(result.data, { convert: false }))
    .then(result => log('transform-utility-no-convert-example', result));
//#

//#containerdata-example
const getContainerData = client =>
  client
    .find('Heroes', { imageName: '*' }, { limit: 1 })
    .then(result =>
      containerData(
        result.data,
        'fieldData.image',
        './assets',
        'fieldData.imageName'
      )
    )
    .then(result => log('containerdata-example', result));
//#

const utilities = client =>
  Promise.all([
    extractFieldData(client),
    extractRecordId(client),
    transformData(client),
    transformDataNoConvert(client),
    getContainerData(client)
  ]).then(responses => client);

module.exports = { utilities };
