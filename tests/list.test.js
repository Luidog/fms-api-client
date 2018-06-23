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

describe('List Capabilities', () => {
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

  it('should allow you to list records', () => {
    return expect(client.list(process.env.LAYOUT))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data');
  });

  it('should allow you use parameters to modify the list response', () => {
    return expect(client.list(process.env.LAYOUT, { _limit: '2' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should should allow you to use numbers in parameters', () => {
    return expect(client.list(process.env.LAYOUT, { _limit: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should should allow you to provide an array of portals in parameters', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        _limit: 2,
        portals: [{ name: 'planets', limit: 1, offset: 1 }]
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.be.a('array')
      .and.property(0)
      .to.have.all.keys('fieldData', 'modId', 'portalData', 'recordId')
      .and.property('portalData')
      .to.be.a('object');
  });

  it('should should remove non used properties from a portal object', () => {
    return expect(
      client
        .list(process.env.LAYOUT, {
          _limit: 2,
          portals: [{ name: 'planets', limit: 1, offset: 1, han: 'solo' }]
        })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.be.a('array')
      .and.property(0)
      .to.have.all.keys('fieldData', 'modId', 'portalData', 'recordId')
      .and.property('portalData')
      .to.be.a('object');
  });

  it('should modify requests to comply with DAPI name reservations', () => {
    return expect(client.list(process.env.LAYOUT, { limit: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should allow strings while complying with DAPI name reservations', () => {
    return expect(client.list(process.env.LAYOUT, { limit: '2' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should allow you to offset the list response', () => {
    return expect(client.list(process.env.LAYOUT, { limit: 2, offset: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should santize parameters that would cause unexpected parameters', () => {
    return expect(
      client.list(process.env.LAYOUT, { error: 'fail', limit: 2, offset: 2 })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data');
  });

  it('should allow you to limit the number of portal records to return', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        portal: ['planets'],
        'limit.planets': 2,
        limit: 2
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should accept namespaced portal limit and offset parameters', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        portal: ['planets'],
        '_limit.planets': 2,
        limit: 2
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should reject invalid parameters', () => {
    return expect(
      client
        .list(process.env.LAYOUT, { error: 'fail', limit: -2, offset: 2 })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
});
