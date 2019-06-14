'use strict';

const { log } = require('./services');

//#script-example
const triggerScript = client =>
  client
    .script('Heroes', 'FMS Triggered Script', { name: 'Han' })
    .then(result => log('script-trigger-example', result));
//#

const script = client =>
  Promise.all([triggerScript(client)]).then(responses => client);

module.exports = { script };
