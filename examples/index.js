'use strict';

const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../index.js');
const { creates } = require('./create.examples');
const { lists } = require('./list.examples');
const { globals } = require('./globals.examples');
const { finds } = require('./find.examples');
const { scripts } = require('./script.examples');
const { edits } = require('./edit.examples');
const { deletes } = require('./delete.examples');
const { authentication } = require('./authentication.examples');
const { datastore } = require('./datastore.examples');

environment.config({ path: './tests/.env' });

varium(process.env, './tests/env.manifest');

const examples = [];
//#datastore-connect-example
connect('nedb://memory')
  //#
  .then(db => {
    //#client-create-example
    const client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    //#
    //#client-save-example
    return client
      .save()
      .then(client => creates(client, examples))
      .then(client => lists(client, examples))
      .then(client => finds(client, examples))
      .then(client => edits(client, examples))
      .then(client => scripts(client, examples))
      .then(client => globals(client, examples))
      .then(client => deletes(client, examples))
      .then(client => authentication(client, examples));
    // #
  })
  .then(client => datastore(client, examples));
