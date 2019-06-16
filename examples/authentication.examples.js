'use strict';

const { log, store } = require('./services');

//#client-login-example
const login = client =>
  client.login().then(result => log('client-login-example', result));
//#

//#client-logout-example
const logout = client =>
  client
    .login()
    .then(() => client.logout())
    .then(result => log('client-logout-example', result));
//#

const authentication = client =>
  Promise.all([login(client), logout(client)]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { authentication };
