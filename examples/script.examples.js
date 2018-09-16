'use strict';

//# script-trigger-example
const triggerScript = client => client.script('FMS Triggered Script', 'Heroes');
//#

const scripts = (client, examples) =>
  Promise.all([triggerScript(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { scripts };
