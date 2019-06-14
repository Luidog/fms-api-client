'use strict';

const { log, store } = require('./services');

//#client-logout-example
const logout = client =>
  client
    .login()
    .then(() => client.logout())
    .then(result => log('client-logout-example', result));
//#

//#client-login-example
const login = client =>
  client
    .login()
    .then(result => {
      console.log(result);
      return result;
    })
    .catch(error => console.log('login error', error));
//#

const authentication = client =>
  Promise.all([login(client), logout(client), login(client)]).then(
    responses => {
      store(responses);
      return client;
    }
  );

module.exports = { authentication };
