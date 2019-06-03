/* global describe before after it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker, recordId } = require('../index.js');

chai.use(chaiAsPromised);

describe('RecordId Capabilities', () => {
  let database, client;

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
      .logout()
      .then(response => done())
      .catch(error => done());
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

  it('it should extract the recordId while maintaining the array', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response => client.get(process.env.LAYOUT, response.recordId))
        .then(record => recordId(record.data))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('string');
  });

  it('it should extract recordId while maintaining the object', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response => client.get(process.env.LAYOUT, response.recordId))
        .then(record => recordId(record.data[0]))
    ).to.eventually.be.a('string');
  });
});
