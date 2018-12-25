/* global describe before after it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');
const _ = require('lodash');
/* eslint-enable */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker, containerData } = require('../index');

chai.use(chaiAsPromised);

describe('ContainerData Capabilities', () => {
  let database, client;

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
    client.logout().then(response => done());
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

  it('should download container data from an object to a file', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 1 })
        .then(response =>
          containerData(
            response.data[0],
            'fieldData.image',
            'fieldData.imageName',
            './assets'
          )
        )
    )
      .to.eventually.be.a('object')
      .and.to.all.include.keys('name', 'path');
  });

  it('should download container data from an array to a file', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 2 })
        .then(response =>
          containerData(
            response.data,
            'fieldData.image',
            'fieldData.imageName',
            './assets'
          )
        )
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('name', 'path');
  });
  it('should download container data from an array to a buffer', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 2 })
        .then(response =>
          containerData(
            response.data,
            'fieldData.image',
            'fieldData.imageName',
            'buffer'
          )
        )
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('name', 'buffer');
  });
  it('should download container data from an object to a buffer', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 1 })
        .then(response =>
          containerData(
            response.data[0],
            'fieldData.image',
            'fieldData.imageName',
            'buffer'
          )
        )
    )
      .to.be.eventually.be.a('object')
      .and.to.all.include.keys('name', 'buffer');
  });
  it('should reject with an error and a message', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 1 })
        .then(response =>
          containerData(
            response.data[0],
            'fieldData.image',
            'fieldData.imageName',
            './path/does/not/exist'
          )
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });
  it('should reject with an error and a message', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 1 })
        .then(response =>
          containerData(
            response.data[0],
            'fieldData.image',
            'fieldData.imageName',
            'buffer',
            { jar: true }
          )
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });
});
