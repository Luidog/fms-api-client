'use strict';

const { log, store } = require('./services');

//#client-logout-example
const logout = client =>
  client.logout().then(result => log('client-logout-example', result));
//#

//#client-login-example
const login = client => client.login();
//#

const authentication = client =>
  Promise.all([login(client), logout(client)]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { authentication };
