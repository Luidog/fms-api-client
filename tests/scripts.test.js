'use strict';

/* global describe before after afterEach it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../index.js');
const { urls } = require('../src/utilities');

const sandbox = sinon.createSandbox();

chai.use(chaiAsPromised);

describe('Database Script List Capabilities', () => {
  let database, client;
  before(done => {
    environment.config({ path: './tests/.env' });
    varium(process.env, './tests/env.manifest');
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
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    client.save().then(client => done());
  });

  after(done => {
    client
      .logout()
      .then(response => done())
      .catch(error => done());
  });

  afterEach(done => {
    sandbox.restore();
    return done();
  });

  it('should get a list of scripts and folders for the currently configured database', () => {
    return expect(client.scripts())
      .to.eventually.be.a('object')
      .that.has.all.keys('scripts');
  });
  it('should fail with a code and a message', () => {
    sandbox.stub(urls, 'scripts').callsFake(() => 'https://httpstat.us/502');
    return expect(client.scripts().catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
});
