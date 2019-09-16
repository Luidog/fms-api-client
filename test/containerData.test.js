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
const { Filemaker, containerData } = require('../index');

const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

describe('ContainerData Capabilities', () => {
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
        client = Filemaker.create({
          database: process.env.DATABASE,
          server: process.env.SERVER,
          user: process.env.USERNAME,
          password: process.env.PASSWORD
        });
        client.save().then(client => done());
      });
  });

  after(done => {
    client
      .reset()
      .then(response => done())
      .catch(error => done());
  });

  it('should download container data from an object to a file', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 1 })
        .then(response =>
          containerData(
            response.data[0],
            'fieldData.image',
            './assets',
            'fieldData.imageName'
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
            './assets',
            'fieldData.imageName'
          )
        )
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('name', 'path');
  });

  it('should return an array of records if it is passed an array', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 2 })
        .then(response =>
          containerData(response.data, 'fieldData.image', './assets')
        )
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
      .and.to.all.include.keys('name', 'path');
  });
  it('should return a single record object if passed an object', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 1 })
        .then(response =>
          containerData(response.data[0], 'fieldData.image', './assets')
        )
    )
      .to.eventually.be.a('object')
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
            'buffer',
            'fieldData.imageName'
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
            'buffer',
            'fieldData.imageName'
          )
        )
    )
      .to.be.eventually.be.a('object')
      .and.to.all.include.keys('name', 'buffer');
  });

  it('should substitute a uuid if the record id can not be found in an object', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 1 })
        .then(response => {
          const data = response.data[0];
          delete data.recordId;
          return data;
        })
        .then(data => containerData(data, 'fieldData.image'))
    )
      .to.be.eventually.be.a('object')
      .and.to.all.include.keys('name', 'buffer');
  });

  it('should substitute a uuid if the record id can not be found in an array', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 2 })
        .then(response => {
          delete response.data[0].recordId;
          delete response.data[1].recordId;
          return response.data;
        })
        .then(data => containerData(data, 'fieldData.image'))
    )
      .to.eventually.be.a('array')
      .and.property('0')
      .to.be.a('object')
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
            './path/does/not/exist',
            'fieldData.imageName'
          )
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });
  it('should reject if WPE rejects the request', () => {
    return expect(
      client
        .find(process.env.LAYOUT, { imageName: '*' }, { limit: 1 })
        .then(response => {
          response.data[0].fieldData.image = response.data[0].fieldData.image.replace(
            'MainDB',
            'FailDB'
          );
          return containerData(
            response.data[0],
            'fieldData.image',
            'buffer',
            'fieldData.imageName'
          );
        })

        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });
});
