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

describe('Storage', () => {
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

  it('should allow an instance to be created', () => {
    return expect(Promise.resolve(client))
      .to.eventually.be.an('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'application',
        'server',
        'version'
      );
  });

  it('should allow an instance to be saved.', () => {
    return expect(client.save())
      .to.eventually.be.an('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'application',
        'server',
        'version'
      );
  });

  it('should allow an instance to be recalled', () => {
    return expect(Filemaker.findOne({}))
      .to.eventually.be.an('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'application',
        'server',
        'version'
      );
  });

  it('should allow insances to be listed', () => {
    return expect(Filemaker.find({})).to.eventually.be.an('array');
  });

  it('should allow you to remove an instance', () => {
    return expect(Filemaker.deleteOne({}))
      .to.eventually.be.an('number')
      .and.equal(1);
  });
});
