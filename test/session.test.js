'use strict';

/* global describe before after beforeEach afterEach it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');
const { admin } = require('./admin');

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

describe('Session Capabilities', () => {
  let database;
  let client;
  const name = 'testing-client';

  before(done => {
    environment.config({ path: './test/.env' });
    varium({ manifestPath });
    connect('mongodb://127.0.0.1:27017/dapi')
      .then(db => {
        database = db;
        return database.dropDatabase();
      })
      .then(() => {
        client = Filemaker.create({
          name,
          database: process.env.DATABASE,
          server: process.env.SERVER,
          user: process.env.USERNAME,
          concurrency: 1,
          password: process.env.PASSWORD
        });
        return client.save();
      })
      .then(client => admin.login())
      .then(() => admin.sessions.drop({ userName: process.env.USERNAME }))
      .then(() => new Promise(resolve => setTimeout(() => done(), 12000)));
  });

  beforeEach(done => {
    admin
      .login()
      .then(() => done())
      .catch(error => done(new Error(error.response.data.messages[0].text)));
  });

  afterEach(done => {
    admin
      .logout()
      .then(() => done())
      .catch(error => done(new Error(error.response.data.messages[0].text)));
  });

  after(done => {
    client
      .reset()
      .then(response => done())
      .catch(error => done(error));
  });

  it('should create a client session', () => {
    return expect(
      Filemaker.findOne({ name }).then(client =>
        client
          .login()
          .then(
            token =>
              new Promise(resolve => setTimeout(() => resolve(token), 12000))
          )
          .then(response =>
            admin.sessions.find({ userName: process.env.USERNAME })
          )
      )
    )
      .to.eventually.be.a('array')
      .to.have.a.lengthOf(1);
  });

  it('should reuse a client session', () => {
    return expect(
      Filemaker.findOne({ name })
        .then(client => client.list(process.env.LAYOUT))
        .then(
          response =>
            new Promise(resolve => setTimeout(() => resolve(response), 12000))
        )
        .then(response =>
          admin.sessions.find({ userName: process.env.USERNAME })
        )
    )
      .to.eventually.be.a('array')
      .to.have.a.lengthOf(1);
  });

  it('should automatically remove an invalid session', () => {
    return expect(
      admin.sessions
        .drop({ userName: process.env.USERNAME })
        .then(() => new Promise(resolve => setTimeout(() => resolve(), 12000)))
        .then(() => Filemaker.findOne({ name }))
        .then(client => client.list(process.env.LAYOUT).catch(error => error))
        .then(() => client.agent.connection.sessions)
    )
      .to.eventually.be.a('array')
      .to.have.a.lengthOf(0);
  });

  it('should automatically create a new session when required', () => {
    return expect(
      admin.sessions
        .drop({ userName: process.env.USERNAME })
        .then(
          token =>
            new Promise(resolve => setTimeout(() => resolve(token), 12000))
        )
        .then(() =>
          Filemaker.findOne({ name }).then(client =>
            client.list(process.env.LAYOUT)
          )
        )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data', 'dataInfo');
  });
});
