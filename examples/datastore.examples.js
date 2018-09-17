'use strict';

const { examples } = require('./services');
const { Filemaker } = require('../index.js');

const removeExampleRecords = client =>
  Filemaker.findOne({ _id: client._id }).then(client =>
    examples.map(object => client.delete('Heroes', object.recordId))
  );

const datastore = client => Promise.all([removeExampleRecords(client)]);

module.exports = { datastore };
