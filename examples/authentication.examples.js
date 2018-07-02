'use strict';

const logout = client => client.logout();

const login = client =>
  client.authenticate();

const authentication = (client, examples) =>
  Promise.all([login(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { authentication };
