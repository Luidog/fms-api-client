'use strict';

const { log, store } = require('./services');

//#upload-image-example
const uploadImage = client =>
  client
    .upload('./assets/placeholder.md', 'Heroes', 'image')
    .then(result => log('upload-image-example', result));
//#

//#upload-specific-record-example
const uploadSpecificImage = client =>
  client
    .find('Heroes', [{ name: 'Luke Skywalker' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId =>
      client.upload('./assets/placeholder.md', 'Heroes', 'image', recordId)
    )
    .then(result => log('upload-specific-record-example', result));
//#

const uploads = (client, examples) =>
  Promise.all([uploadImage(client), uploadSpecificImage(client)]).then(
    responses => {
      store(responses);
      return client;
    }
  );

module.exports = { uploads };
