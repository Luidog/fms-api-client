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

describe('Data Usage ', () => {
  let database;
  let client;

  describe('Tracks Data Usage', () => {
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
        .logout()
        .then(response => done())
        .catch(error => done());
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
  describe('Does Not Track Data Usage', () => {
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
        password: process.env.PASSWORD,
        usage: false
      });
      client.save().then(client => done());
    });

    after(done => {
      client
        .logout()
        .then(response => done())
        .catch(error => done());
    });

    it('should not track data usage in', () => {
      return expect(
        client
          .create(process.env.LAYOUT, { name: 'Luke Skywalker' })
          .then(response => client.data.status())
      )
        .to.eventually.be.an('object')
        .and.property('data')
        .that.has.all.keys('in', 'out', 'since')
        .and.property('in', '0 Bytes');
    });

    it('should not track data usage out', () => {
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
        .and.property('data')
        .that.has.all.keys('in', 'out', 'since')
        .and.property('out', '0 Bytes');
    });
  });
});
