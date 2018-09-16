'use strict';

const { Filemaker } = require('../index.js');

const removeExampleRecords = (client, examples) =>
  Filemaker.findOne({ _id: client._id }).then(client =>
    examples.map(object => client.delete('Heroes', object.recordId))
  );

const datastore = (client, data) => {
  return Promise.all([removeExampleRecords(client, data)]);
};

module.exports = { datastore };
