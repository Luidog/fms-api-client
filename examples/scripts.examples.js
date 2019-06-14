'use strict';

const { log } = require('./services');

//#script-run-example
const runScript = client =>
  client
    .run('Heroes', { script: 'FMS Triggered Script' })
    .then(result => log('script-run-example', result));
//#

//#scripts-run-example
const runScripts = client =>
  client
    .run('Heroes', [{ script: 'FMS Triggered Script' }])
    .then(result => log('script-run-example', result));
//#

const scripts = client =>
  Promise.all([runScript(client), runScripts(client)]).then(
    responses => client
  );

module.exports = { scripts };
