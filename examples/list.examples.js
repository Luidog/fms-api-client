'use strict';

//#list-records-example
const listHeroes = client =>
  client.list('Heroes', { limit: 5 }).then(response => response.data);
//#

const lists = (client, examples) =>
  Promise.all([listHeroes(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { lists };
