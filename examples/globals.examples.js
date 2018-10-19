'use strict';

const { log } = require('./services');

//#set-globals-example
const setGlobals = client =>
  client
    .globals({ 'Globals::ship': 'Millenium Falcon' })
    .then(result => log('set-globals-example', result));
//#

const globals = (client, examples) =>
  Promise.all([setGlobals(client)]).then(responses => client);

module.exports = { globals };
