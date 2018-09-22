/* global describe before after it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');
const _ = require('lodash');
/* eslint-enable */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker, transform } = require('../index');

chai.use(chaiAsPromised);

describe('Transform Capabilities', () => {
  let database, client;

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
    client.logout().then(response => done());
  });

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

  it('should merge portal data and field data from an array', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('portalData', 'fieldData');
  });

  it('should merge portal data and field data from an object', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data[0]))
    )
      .to.eventually.to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('portalData', 'fieldData');
  });

  it('should optionally not convert table::field keys from an array', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data, { convert: false }))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('portalData', 'fieldData');
  });

  it('should optionally not convert table::field keys from an object', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data[0], { convert: false }))
    )
      .to.eventually.to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('portalData', 'fieldData');
  });

  it('should allow you to remove field data from an array', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data, { fieldData: false }))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('fieldData');
  });

  it('should allow you to remove field data from an object', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data[0], { fieldData: false }))
    )
      .to.eventually.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('fieldData');
  });

  it('should allow you to remove portal data from an array', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data, { portalData: false }))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('portalData');
  });

  it('should allow you to remove portal data from an object', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data, { portalData: false }))
    )
      .to.eventually.to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('portalData');
  });

  it('should merge portal data and portal data from an array', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { name: 'Han Solo' })
        .then(response => transform(response.data, { portalData: false }))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('portalData');
  });
});
