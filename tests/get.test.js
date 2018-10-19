'use strict';

/* global describe before after it */

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

describe('Get Capabilities', () => {
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

  it('should get specific FileMaker records.', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response => client.get(process.env.LAYOUT, response.recordId))
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data');
  });

  it('should allow you to specify a timeout', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Darth Vader' })
        .then(response =>
          client.get(process.env.LAYOUT, response.recordId, {
            request: { timeout: 10 }
          })
        )
        .catch(error => error)
    ).to.eventually.be.an('error');
  });

  it('should reject get requests that do not specify a recordId', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response => client.get(process.env.LAYOUT, '-2'))
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should allow you to limit the number of portal records to return', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.get(process.env.LAYOUT, response.recordId, {
          portal: ['planets'],
          'limit.planets': 2
        })
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data');
  });

  it('should accept namespaced portal limit and offset parameters', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.get(process.env.LAYOUT, response.recordId, {
          portal: ['planets'],
          '_limit.planets': 2
        })
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data');
  });
  it('should remove an expired token', () => {
    client.connection.token = `${client.connection.token}-error`;
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).catch(error => {
        let errorWithToken = Object.assign(error, {
          token: client.connection.token
        });
        return errorWithToken;
      })
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message', 'token')
      .and.property('token').to.be.empty;
  });
});
