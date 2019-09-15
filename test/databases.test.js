'use strict';

/* global describe before after afterEach it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker, databases } = require('../index.js');
const { urls } = require('../src/utilities');

const sandbox = sinon.createSandbox();

const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

process.on('unhandledRejection', () => {});

process.on('rejectionHandled', () => {});

describe('Databases Capabilities', () => {
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

  afterEach(done => {
    sandbox.restore();
    return done();
  });

  it('should get hosted databases', () => {
    return expect(client.databases())
      .to.eventually.be.a('object')
      .that.has.all.keys('databases');
  });
  it('should fail with a code and a message', () => {
    sandbox.stub(urls, 'databases').callsFake(() => 'https://httpstat.us/502');
    return expect(client.databases().catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
});

describe('Databases Utility Capabilities', () => {
  before(done => {
    environment.config({ path: './test/.env' });
    varium({ manifestPath });
    return done();
  });

  it('should retrieve databases without credentials', () => {
    return expect(databases(process.env.SERVER))
      .to.eventually.be.a('object')
      .that.has.all.keys('databases');
  });
  it('should retrieve databases using account credentials', () => {
    return expect(
      databases(process.env.SERVER, {
        user: process.env.USER,
        password: process.env.PASSWORD
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('databases');
  });
  it('should fail with a code and a message', () => {
    return expect(databases('http://not-a-server.com').catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
  it('should require a server to list databases', () => {
    return expect(databases().catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
});
