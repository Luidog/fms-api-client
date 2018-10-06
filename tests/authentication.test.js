'use strict';

/* global describe before beforeEach it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../index.js');

chai.use(chaiAsPromised);

describe('Authentication Capabilities', () => {
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

  beforeEach(done => {
    client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    done();
  });

  it('should authenticate into FileMaker.', () => {
    return expect(client.login())
      .to.eventually.be.a('object')
      .that.has.all.keys('token');
  });

  it('should automatically request an authentication token', () => {
    return expect(
      client
        .create(process.env.LAYOUT, {})
        .then(record => Promise.resolve(client.connection.token))
    ).to.eventually.be.a('string');
  });

  it('should reuse a saved authentication token', () => {
    return expect(
      client
        .create(process.env.LAYOUT, {})
        .then(record => client.connection.token)
        .then(token => {
          client.create(process.env.LAYOUT, {});
          return token;
        })
        .then(token => Promise.resolve(token === client.connection.token))
    ).to.eventually.be.true;
  });

  it('should log out of the filemaker.', () => {
    return expect(
      client
        .authenticate()
        .then(token => client.logout())
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should not attempt a logout if there is no valid token.', () => {
    return expect(client.logout().catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message');
  });

  it('should reject if the logout request fails', () => {
    return expect(
      client
        .authenticate()
        .then(token => {
          client.connection.token = 'invalid';
          return client;
        })
        .then(client => client.logout())
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject if the authentication request fails', () => {
    client.connection.credentials.password = 'incorrect';
    return expect(
      client
        .save()
        .then(client => client.login())
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message');
  });

  it('should attempt to log out before being removed', () => {
    client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    return expect(
      client
        .save()
        .then(client => client.login().then(response => client.destroy()))
    )
      .to.eventually.be.an('number')
      .and.equal(1);
  });

  it('should catch the log out error before being removed if the login is not valid', () => {
    client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: 'wrong-password'
    });
    return expect(client.save().then(client => client.destroy()))
      .to.eventually.be.an('number')
      .and.equal(1);
  });
});
