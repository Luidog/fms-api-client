'use strict';

//#client-logout-example
const logout = client => client.logout();
//#

//#client-authenticate-example
const login = client => client.authenticate();
//#

const authentication = (client, examples) =>
  Promise.all([login(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { authentication };
