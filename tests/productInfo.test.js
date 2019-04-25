'use strict';

/* global describe before after it */

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

describe('Product Info Capabilities', () => {
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
      application: process.env.APPLICATION,
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
