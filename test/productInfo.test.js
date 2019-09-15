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
const { Filemaker, productInfo } = require('../index.js');
const { urls } = require('../src/utilities');

const sandbox = sinon.createSandbox();
const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

process.on('unhandledRejection', () => {});
process.on('rejectionHandled', () => {});

describe('Client Product Info Capabilities', () => {
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

  it('should get FileMaker Server Information', () => {
    return expect(client.productInfo())
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'name',
        'buildDate',
        'version',
        'dateFormat',
        'timeFormat',
        'timeStampFormat'
      );
  });
  it('should fail with a code and a message', () => {
    sandbox
      .stub(urls, 'productInfo')
      .callsFake(() => 'https://httpstat.us/502');
    return expect(client.productInfo().catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
});

describe('Product Info Utility Capabilities', () => {
  before(done => {
    environment.config({ path: './test/.env' });
    varium({ manifestPath });
    return done();
  });

  it('should get FileMaker Server Information', () => {
    return expect(productInfo(process.env.SERVER))
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'name',
        'buildDate',
        'version',
        'dateFormat',
        'timeFormat',
        'timeStampFormat'
      );
  });
  it('should fail with a code and a message', () => {
    return expect(productInfo('http://not-a-server.com').catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
  it('should require a server parameter', () => {
    return expect(productInfo().catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
});
