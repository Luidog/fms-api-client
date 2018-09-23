'use strict';

const { log, store } = require('./services');

//#upload-image-example
const uploadImage = client =>
  client
    .upload('./assets/placeholder.md', 'Heroes', 'image')
    .then(result => log('upload-image-example', result));
//#

const uploadSpecificImage = client =>
  client
    .find('Heroes', [{ name: 'yoda' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(recordId =>
      setTimeout(
        () =>
          //#upload-specific-record-example
          client
            .upload('./assets/placeholder.md', 'Heroes', 'image', recordId)
            .then(result => log('upload-specific-record-example', result)),
        //#
        1000
      )
    );

//#

const uploads = client =>
  Promise.all([uploadImage(client), uploadSpecificImage(client)]).then(
    responses => {
      store(responses);
      return client;
    }
  );

module.exports = { uploads };
