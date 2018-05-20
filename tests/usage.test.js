const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../filemaker');
const { expect, should } = require('chai');

chai.use(chaiAsPromised);

describe('Client Data Usage Tracking', () => {
  let database = null;

  beforeEach(done => {
    filemaker = Filemaker.create({
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
      filemaker
        .create('Heroes', { name: 'Luke Skywalker' })
        .then(response => filemaker.data.status())
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('data');
  });

  it('should allow you to reset usage data.', () => {
    return expect(
      filemaker
        .create('Heroes', { name: 'Luke Skywalker' })
        .then(response => {
          filemaker.data.clear();
          return filemaker;
        })
        .then(filemaker => filemaker.data.status())
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('data');
  });
});
