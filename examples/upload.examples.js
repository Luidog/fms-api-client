'use strict';

//#upload-image-example
const uploadImage = client =>
  client.upload('./assets/placeholder.md', 'Heroes', 'image');
//#

const uploadSpecificImage = client =>
  client
    .find('Heroes', [{ name: 'Luke Skywalker' }], { limit: 1 })
    .then(response => response.data[0].recordId)
    .then(
      recordId =>
        //#upload-specific-record-example
        client.upload('./assets/placeholder.md', 'Heroes', 'image', recordId)
      //#
    );

const uploads = (client, examples) =>
  Promise.all([uploadImage(client), uploadSpecificImage(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { uploads };
