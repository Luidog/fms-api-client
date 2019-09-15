'use strict';

/* global describe before beforeEach it */

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
const { Filemaker } = require('../index.js');

const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

describe('Storage', () => {
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
      .then(() => {
        return done();
      });
  });

  beforeEach(done => {
    client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    done();
  });

  it('should allow an instance to be created', () => {
    return expect(Promise.resolve(client))
      .to.eventually.be.an('object')
      .that.has.all.keys('_schema', '_id', 'data', 'agent', 'name');
  });

  it('should allow an instance to be saved.', () => {
    return expect(client.save())
      .to.eventually.be.an('object')
      .that.has.all.keys('_schema', '_id', 'data', 'agent', 'name');
  });

  it('should reject if a client can not be validated', () => {
    client = Filemaker.create({
      database: process.env.DATABASE,
      server: 'mutesymphony.com',
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    return expect(client.save().catch(error => error)).to.eventually.be.an(
      'error'
    );
  });

  it('should allow an instance to be recalled', () => {
    return expect(Filemaker.findOne({}))
      .to.eventually.be.an('object')
      .that.has.all.keys('_schema', '_id', 'data', 'agent', 'name');
  });

  it('should allow instances to be listed', () => {
    return expect(Filemaker.find({})).to.eventually.be.an('array');
  });

  it('should allow you to remove an instance', () => {
    return expect(Filemaker.deleteOne({}))
      .to.eventually.be.an('number')
      .and.equal(1);
  });
});
