'use strict';

const { log } = require('./services');

//#run-script-example
const runScript = client =>
  client
    .run('Heroes', { name: 'FMS Triggered Script', param: { name: 'Han' } })
    .then(result => log('run-script-example', result));
//#

//#run-script-string-example
const runScriptsString = client =>
  client
    .run('Heroes', 'FMS Triggered Script')
    .then(result => log('run-script-string-example', result));
//#

//#run-script-string-with-parameters-example
const runScriptsStringWithParameters = client =>
  client
    .run('Heroes', 'FMS Triggered Script', { name: 'Han' })
    .then(result => log('run-script-with-parameters-example', result));
//#

//#run-scripts-example
const runMultipleScripts = client =>
  client
    .run('Heroes', [
      { name: 'FMS Triggered Script', param: { name: 'Han' } },
      { name: 'FMS Triggered Script', phase: 'presort', param: { name: 'Han' } }
    ])
    .then(result => log('run-scripts-example', result));
//#

//#run-single-script-example
const runSingleScript = client =>
  client
    .run('Heroes', [{ name: 'FMS Triggered Script', param: { name: 'Han' } }])
    .then(result => log('run-single-script-example', result));
//#

const scripts = client =>
  Promise.all([
    runScript(client),
    runSingleScript(client),
    runMultipleScripts(client),
    runScriptsString(client),
    runScriptsStringWithParameters(client)
  ]).then(responses => client);

module.exports = { scripts };
