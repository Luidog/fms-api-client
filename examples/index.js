'use strict';

const environment = require('dotenv');
const varium = require('varium');
const { Filemaker } = require('../index.js');
const { authentication } = require('./authentication.examples');
const { metadata } = require('./metadata.examples');
const { creates } = require('./create.examples');
const { gets } = require('./get.examples');
const { lists } = require('./list.examples');
const { finds } = require('./find.examples');
const { edits } = require('./edit.examples');
const { scripts } = require('./script.examples');
const { globals } = require('./globals.examples');
const { deletes } = require('./delete.examples');
const { uploads } = require('./upload.examples');
const { utilities } = require('./utility.examples');
const { datastore } = require('./datastore.examples');

environment.config({ path: './tests/.env' });

varium(process.env, './tests/env.manifest');

//#datastore-connect-example
const { connect } = require('marpat');
connect('nedb://memory')
  //#
  .then(db => {
    //#client-create-example
    const client = Filemaker.create({
      name: process.env.CLIENT_NAME,
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: process.env.CLIENT_USAGE_TRACKING,
      agent: { rejectUnauthorized: false }
    });
    //#
    //#client-save-example
    return client.save();
  })
  .then(client => authentication(client))
  .then(client => metadata(client))
  .then(client => creates(client))
  .then(client => gets(client))
  .then(client => lists(client))
  .then(client => finds(client))
  .then(client => edits(client))
  .then(client => scripts(client))
  .then(client => globals(client))
  .then(client => deletes(client))
  .then(client => uploads(client))
  .then(client => utilities(client))
  // #
  .then(client => datastore(client))
  .catch(error => console.log('error', error));
