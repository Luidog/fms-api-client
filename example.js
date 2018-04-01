const { connect } = require('marpat');
const { Filemaker } = require('./filemaker');
const environment = require('dotenv');
const varium = require('varium');

environment.config({ path: './tests/.env' });
varium(process.env, './tests/env.manifest');

connect('nedb://data').then(db => {
  const filemaker = Filemaker.create({
    application: process.env.APPLICATION,
    server: process.env.SERVER,
    _username: process.env.USERNAME,
    _password: process.env.PASSWORD,
    _layout: process.env.LAYOUT
  });

  filemaker.save().then(client => {
    client.create('Heroes', { name: 'Han Solo' }).then(response => {
      client
        .edit('Heroes', response.recordId, { name: 'Luke Skywalker' })
        .then(response => console.log(response))
        .catch(error => console.log(error));
      client
        .delete('Heroes', response.recordId)
        .then(response => console.log(response))
        .catch(error => console.log(error));
      client
        .create('Heroes', { name: 'Darth Vader' })
        .then(response => {
          console.log('response', response);
          client
            .get('Heroes', response.recordId)
            .then(response => console.log(response));
        })
        .catch(error => console.log(error));
    });
  });
});
