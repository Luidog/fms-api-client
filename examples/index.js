'use strict';

/* eslint-disable */

const colors = require('colors');

/* eslint-enable */

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
const { authentication } = require('./authentication.examples');
const { datastore } = require('./datastore.examples');

environment.config({ path: './tests/.env' });

varium(process.env, './tests/env.manifest');

/**
 * Connect must be called before the filemaker class is instiantiated. This
 * connect uses Marpat. Marpat is a fork of Camo. much love to
 * https://github.com/scottwrobinson for his creation and maintenance of Camo.
 * My fork of Camo - Marpat is designed to allow the use of multiple datastores
 * with the focus on encrypted storage.
 */
const examples = [];

connect('nedb://memory')
  .then(db => {
    /**
     * The client is a Class. The Class then offers methods designed to
     * make it easier to integrate into FileMaker's DAPI.
     */

    const client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    /**
     * A client can be used directly after saving it. It is also stored on the
     * datastore so that it can be reused later.
     */
    return client
      .save()
      .then(client => creates(client, examples))
      .then(client => lists(client, examples))
      .then(client => globals(client, examples))
      .then(client => finds(client, examples))
      .then(client => scripts(client, examples))
      .then(client => edits(client, examples))
      .then(client => authentication(client, examples));
  })
  .then(client => datastore(client, examples));
