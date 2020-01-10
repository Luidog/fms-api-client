'use strict';

const environment = require('dotenv');
const varium = require('varium');
const { Filemaker } = require('../index.js');
const { authentication } = require('./authentication.examples');
const { validation } = require('./validation.examples');
const { metadata } = require('./metadata.examples');
const { creates } = require('./create.examples');
const { duplicate } = require('./duplicate.examples');
const { gets } = require('./get.examples');
const { lists } = require('./list.examples');
const { finds } = require('./find.examples');
const { edits } = require('./edit.examples');
const { script } = require('./script.examples');
const { scripts } = require('./scripts.examples');
const { globals } = require('./globals.examples');
const { deletes } = require('./delete.examples');
const { uploads } = require('./upload.examples');
const { utilities } = require('./utility.examples');
const { datastore } = require('./datastore.examples');

environment.config({ path: './test/.env' });

varium({ manifestPath: '../test/env.manifest' });

//#datastore-connect-example
const { connect } = require('marpat');
connect('nedb://memory')
  //#
  .then(db => {
    //#client-create-example
    const client = Filemaker.create({
      name: process.env.CLIENT_NAME,
      database: process.env.DATABASE,
      concurrency: 3,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: process.env.CLIENT_USAGE_TRACKING
    });
    //#
    //#client-save-example
    return client.save();
  })
  .then(client => authentication(client))
  .then(client => validation(client))
  .then(client => metadata(client))
  .then(client => creates(client))
  .then(client => duplicate(client))
  .then(client => gets(client))
  .then(client => lists(client))
  .then(client => finds(client))
  .then(client => edits(client))
  .then(client => scripts(client))
  .then(client => script(client))
  .then(client => globals(client))
  .then(client => deletes(client))
  .then(client => uploads(client))
  .then(client => utilities(client))
  // #
  .then(client => datastore(client))
  .catch(error => console.log('error', error));
