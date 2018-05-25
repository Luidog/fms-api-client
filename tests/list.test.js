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
  let database, filemaker;
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
    filemaker = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    done();
  });

  it('should allow you to list records', () => {
    return expect(filemaker.list(process.env.LAYOUT))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data');
  });

  it('should allow you use parameters to modify the list response', () => {
    return expect(filemaker.list(process.env.LAYOUT, { _limit: '2' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should should allow you to use numbers in parameters', () => {
    return expect(filemaker.list(process.env.LAYOUT, { _limit: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should modify requests to comply with DAPI name reservations', () => {
    return expect(filemaker.list(process.env.LAYOUT, { limit: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should allow strings while complying with DAPI name reservations', () => {
    return expect(filemaker.list(process.env.LAYOUT, { limit: '2' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should allow you to offset the list response', () => {
    return expect(filemaker.list(process.env.LAYOUT, { limit: 2, offset: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });

  it('should reject requests that use unexpected parameters', () => {
    return expect(
      filemaker
        .list(process.env.LAYOUT, { error: 'fail', limit: 2, offset: 2 })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });
});
