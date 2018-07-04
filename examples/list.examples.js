'use strict';

/**
 * You can use the client to list filemaker records. The List method
 * accepts a layout and parameter variable. The client will automatically
 * santize the limit, offset, and sort keys to correspond with the DAPI's
 * requirements.
 *
 * This List method also accepts an option of scripts. The script key is
 * an array containing the following schema:
 *
 * "scripts": [
 *   {
 *    "name": "",
 *    "phase": "",
 *    "param": {} || ""
 *  }
 * ]
 */
const listHeroes = client =>
  client.list('Heroes', { limit: 5 }).then(response => response.data);

const lists = (client, examples) =>
  Promise.all([listHeroes(client)])
    .then(responses => {
      examples.concat(responses);
      return client;
    })
    .catch(error => console.log('That is no moon....'.red, error));

module.exports = { lists };
