'use strict';

/* global describe before afterEach it */

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
const sinon = require('sinon');
const { Filemaker } = require('../index.js');

const sandbox = sinon.createSandbox();

chai.use(chaiAsPromised);

const manifestPath = path.join(__dirname, './env.manifest');

const error = {
  response: {
    config: { headers: { Authorization: 'Bearer Invalid' } },
    status: 401,
    data: { messages: [{ code: '952', message: 'Invalid Data API Token' }] }
  }
};

const request = {
  url: 'fmp://test-server'
};

describe('Agent Configuration Capabilities', () => {
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
      .then(() => done());
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

  afterEach(done => {
    sandbox.restore();
    return done();
  });

  it('should attempt to clear invalid sessions', () => {
    return expect(
      client
        .login()
        .then(response => client.agent.handleError(error))
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('message', 'code');
  });

  it('should attempt to clear invalid sessions even if there is no header', () => {
    delete error.response.config.headers.Authorization;
    return expect(
      client
        .login()
        .then(response => client.agent.handleError(error))
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('message', 'code');
  });

  it('should reject non http protocol requests', () => {
    return expect(
      client
        .login()
        .then(response => client.agent.handleRequest(request))
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('message', 'code');
  });
});
