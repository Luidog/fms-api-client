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

  filemaker
    .save()
    .then(client => console.log(client.toJSON()))
    .catch(error => console.log(error));

  filemaker
    .authenticate()
    .then(token => console.log(token))
    .catch(error => console.log(error));
});
