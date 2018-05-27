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

describe('Create Capabilities', () => {
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

  it('should create FileMaker records.', () => {
    return expect(filemaker.create(process.env.LAYOUT, { name: 'Han Solo' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId');
  });

  it('should reject bad data with an error', () => {
    return expect(
      filemaker.create(process.env.LAYOUT, 'junk data').catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message');
  });

  it('should create FileMaker records with mixed types', () => {
    return expect(
      filemaker.create(process.env.LAYOUT, {
        name: 'Han Solo',
        array: ['ben'],
        object: { 'co-pilot': 'chewbacca' },
        height: 52
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId');
  });
});
