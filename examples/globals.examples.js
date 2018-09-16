'use strict';

//#set-globals-example
const setGlobals = client =>
  client.globals({ 'Globals::ship': 'Millenium Falcon' });
//#

const globals = (client, examples) =>
  Promise.all([setGlobals(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { globals };
