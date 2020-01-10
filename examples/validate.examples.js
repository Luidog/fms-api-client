'use strict';

const { log, store } = require('./services');


//#client-validate-session-example
const validateSession = client =>
  client
    .login()
    .then(response => client.validate(response.id))
    .then(result => log('client-validate-session-example', result));
//#

//#client-logout-example
const validateToken = client =>
  client
    .login()
    .then(response => client.validate(response.token))
    .then(result => log('client-validate-token-example', result));
//#

const validation = client =>
  Promise.all([validateSession(client), validateToken(client)]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { validation };
