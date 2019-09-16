'use strict';

/* global describe before after it */

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

describe('Duplicate Record Capabilities', () => {
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

  before(done => {
    client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    client.save().then(client => done());
  });

  after(done => {
    client
      .reset()
      .then(response => done())
      .catch(error => done());
  });

  it('should allow you to duplicate a record', () =>
    expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(result => client.duplicate(process.env.LAYOUT, result.recordId))
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId'));

  it('should require an id to duplicate a record', () =>
    expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(result => client.duplicate(process.env.LAYOUT))
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message'));
});
