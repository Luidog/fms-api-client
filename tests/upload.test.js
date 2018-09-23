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

describe('File Upload Capabilities', () => {
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

  it('should allow you to upload a file to a new record', () => {
    return expect(
      client.upload('./assets/placeholder.md', process.env.LAYOUT, 'image')
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', 1);
  });

  it('should allow you to upload a file to a specific container repetition', () => {
    return expect(
      client.upload(
        './assets/placeholder.md',
        process.env.LAYOUT,
        'image',
        undefined,
        2
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', 1);
  });

  it('should reject with a message if it can not find the file to upload', () => {
    return expect(
      client
        .upload('./assets/none.md', process.env.LAYOUT, 'image')
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });

  it('should allow you to upload a file to a specific record', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(
            './assets/placeholder.md',
            process.env.LAYOUT,
            'image',
            record.recordId
          )
        )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', 1);
  });

  it('should allow you to upload a file to a specific record container repetition', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(
            './assets/placeholder.md',
            process.env.LAYOUT,
            'image',
            record.recordId,
            2
          )
        )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId','recordId')
      .and.property('modId', 1);
  });

  it('should reject of the request is invalid', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(
            './assets/placeholder.md',
            'No layout',
            'image',
            record.recordId
          )
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should remove an expired token', () => {
    client.connection.token = `${client.connection.token}-error`;
    return expect(
      client
        .upload('./assets/placeholder.md', process.env.LAYOUT, 'image')
        .catch(error => {
          let errorWithToken = Object.assign(error, {
            token: client.connection.token
          });
          return errorWithToken;
        })
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message', 'token')
      .and.property('token').to.be.empty;
  });
});
