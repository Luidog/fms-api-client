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
const { Filemaker } = require('../filemaker');

chai.use(chaiAsPromised);

describe('Data Usage Tracking Capabilities', () => {
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

  it('should track API usage data.', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Luke Skywalker' })
        .then(response => client.data.status())
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('data');
  });

  it('should allow you to reset usage data.', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Luke Skywalker' })
        .then(response => {
          client.data.clear();
          return client;
        })
        .then(filemaker => client.data.status())
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('data');
  });
});
