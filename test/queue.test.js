'use strict';

/* global describe before after it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../index.js');

const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

describe('Request Queue Capabilities', () => {
  let database;
  let client;

  before(done => {
    environment.config({ path: './test/.env' });
    varium({ manifestPath });
    connect('nedb://memory')
      .then(db => {
        database = db;
        return database.dropDatabase();
      })
      .then(() => {
        return done();
      });
  });

  before(done => {
    client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      concurrency: 25,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    client.save().then(client => done());
  });

  after(done => {
    client
      .reset()
      .then(response => done())
      .catch(error => done());
  });

  it('should queue requests to FileMaker', () => {
    let requests = [];
    for (var i = 6; i >= 0; i--) {
      requests.push(
        client.find(
          process.env.LAYOUT,
          { id: '*' },
          { sort: [{ fieldName: 'id', sortOrder: 'descend' }], limit: 2 }
        )
      );
    }

    return Promise.all(requests).then(results =>
      expect(client.agent.queue).to.be.an('array')
    );
  });
});
