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
const { Filemaker } = require('../index.js');

chai.use(chaiAsPromised);

describe('Open Authentication Capabilities', () => {
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
    client
      .logout()
      .then(response => done())
      .catch(error => done());
  });

  it("should list a server's providers", () => {
    return expect(client.providers())
      .to.eventually.be.a('array')
      .and.property(0)
      .to.be.an('object')
      .that.has.all.keys(
        'AuthCodeEndpoint',
        'AuthType',
        'ClientID',
        'Icon',
        'Name',
        'OIDCEnabled',
        'ProviderEnabled',
        'ProviderID',
        'Response Type',
        'Scope'
      );
  });

  it('should generate an open authentication url', () => {
    return expect(client.providers())
      .to.eventually.be.a('array')
      .and.property(0)
      .to.be.an('object')
      .that.has.all.keys(
        'AuthCodeEndpoint',
        'AuthType',
        'ClientID',
        'Icon',
        'Name',
        'OIDCEnabled',
        'ProviderEnabled',
        'ProviderID',
        'Response Type',
        'Scope'
      );
  });
});
