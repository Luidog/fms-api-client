'use strict';

const _ = require('lodash');
const { Filemaker } = require('../index.js');

const removeExampleRecords = (client, examples) =>
  Filemaker.findOne({ _id: client._id }).then(client =>
    recordIds(examples).map(recordId => client.delete('Heroes', recordId))
  );

const recordIds = data => _.map(_.flattenDeep(data), datum => datum.recordId);

const datastore = (client, data) => {
  return Promise.all([removeExampleRecords(client, data)]).catch(error =>
    console.log('That is no moon....'.red, error)
  );
};

module.exports = { datastore };
