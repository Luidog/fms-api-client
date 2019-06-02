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

describe('Request Interceptor Capabilities', () => {
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

  it('should reject if the server errors', () => {
    sandbox
      .stub(urls, 'authentication')
      .callsFake(() => 'https://httpstat.us/502');
    return expect(
      client
        .save()
        .then(client => client.authenticate())
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message');
  });

  it('should handle non JSON responses by rejecting with a json error', () => {
    sandbox
      .stub(urls, 'authentication')
      .callsFake(() => 'https://httpstat.us/200');
    return expect(
      client
        .save()
        .then(client => client.authenticate())
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject non http requests to the server with a json error', () => {
    sandbox
      .stub(urls, 'authentication')
      .callsFake(
        () =>
          `${process.env.SERVER.replace(
            'https://',
            ''
          )}/fmi/data/v1/databases/${process.env.application}/sessions`
      );
    return expect(
      client
        .save()
        .then(client => client.authenticate())
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject non https requests to the server with a json error', () => {
    sandbox
      .stub(urls, 'authentication')
      .callsFake(
        () =>
          `${process.env.SERVER.replace(
            'https://',
            'http://'
          )}/fmi/data/v1/databases/${process.env.application}/sessions`
      );
    return expect(
      client
        .save()
        .then(client => client.authenticate())
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('message', 'code');
  });
});
