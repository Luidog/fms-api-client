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

describe('Utility Capabilities', () => {
  let database, client;

  beforeEach(done => {
    client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    done();
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

  it('should extract field while maintaining the array', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response => client.get(process.env.LAYOUT, response.recordId))
        .then(record => client.fieldData(record.data))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('fieldData');
  });

  it('should extract field data while maintaining the object', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response => client.get(process.env.LAYOUT, response.recordId))
        .then(record => client.fieldData(record.data[0]))
    )
      .to.eventually.be.a('object')
      .and.to.all.include.keys('modId', 'recordId')
      .and.to.not.include.keys('fieldData');
  });

  it('should extract the recordId while maintaining the array', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response => client.get(process.env.LAYOUT, response.recordId))
        .then(record => client.recordId(record.data))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('string');
  });

  it('should extract field data while maintaining the object', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response => client.get(process.env.LAYOUT, response.recordId))
        .then(record => client.recordId(record.data[0]))
    ).to.eventually.be.a('string');
  });
});
