'use strict';

const { log } = require('./services');

//#script-trigger-example
const triggerScript = client =>
  client
    .script('FMS Triggered Script', 'Heroes', { name: 'Han' })
    .then(result => log('script-trigger-example', result));
//#

const scripts = client =>
  Promise.all([triggerScript(client)]).then(responses => client);

module.exports = { scripts };
