'use strict';

const { log, store } = require('./services');

//#client-logout-example
const logout = client =>
  client.logout().then(result => log('client-logout-example', result));
//#

//#client-authenticate-example
const login = client => client.authenticate();
//#

const authentication = client =>
  Promise.all([login(client), logout]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { authentication };
