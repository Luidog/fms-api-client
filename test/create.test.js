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

describe('Create Capabilities', () => {
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
      .logout()
      .then(response => done())
      .catch(error => done());
  });

  it('should create FileMaker records without fieldData', () => {
    return expect(client.create(process.env.LAYOUT, { name: 'Han Solo' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId');
  });

  it('should allow you to specify a timeout', () => {
    return expect(
      client
        .create(
          process.env.LAYOUT,
          { name: 'Han Solo' },
          { request: { timeout: 10 } }
        )
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .with.any.keys('message', 'code');
  });

  it('should create FileMaker records using fieldData', () => {
    return expect(
      client.create(process.env.LAYOUT, { fieldData: { name: 'Han Solo' } })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId');
  });

  it('should create FileMaker records with portalData', () => {
    return expect(
      client.create(process.env.LAYOUT, {
        fieldData: { name: 'Han Solo' },
        portalData: { Vehicles: [{ 'Vehicles::name': 'Millenium Falcon' }] }
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId');
  });

  it('should allow portalData to be an object or number', () => {
    return expect(
      client.create(process.env.LAYOUT, {
        fieldData: { name: 'Han Solo' },
        portalData: {
          Vehicles: [
            { 'Vehicles::name': { name: 'Millenium Falcon -test' } },
            { 'Vehicles::name': 5 }
          ]
        }
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId');
  });

  it('should reject bad data with an error', () => {
    return expect(
      client.create(process.env.LAYOUT, 'junk data').catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message');
  });

  it('should create records with mixed types', () => {
    return expect(
      client.create(process.env.LAYOUT, {
        name: 'Han Solo',
        array: ['ben'],
        object: { 'co-pilot': 'chewbacca' },
        height: 52
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId');
  });

  it('should substitute an empty object if data is not provided', () => {
    return expect(client.create(process.env.LAYOUT))
      .to.eventually.be.a('object')
      .that.has.all.keys('recordId', 'modId');
  });

  it('should return an object with merged data properties', () => {
    return expect(
      client.create(
        process.env.LAYOUT,
        {
          name: 'Han Solo',
          array: ['ben'],
          object: { 'co-pilot': 'chewbacca' },
          height: 52
        },
        { merge: true }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'recordId',
        'name',
        'array',
        'object',
        'height',
        'modId'
      );
  });

  it('should allow you to run a script when creating a record with a merge response', () => {
    return expect(
      client.create(
        process.env.LAYOUT,
        {
          name: 'Han Solo',
          array: ['ben'],
          object: { 'co-pilot': 'chewbacca' },
          height: 52
        },
        { script: 'FMS Triggered Script', merge: true }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'recordId',
        'name',
        'array',
        'object',
        'height',
        'modId',
        'scriptResult',
        'scriptError'
      );
  });

  it('should allow you to specify scripts as an array', () => {
    return expect(
      client.create(
        process.env.LAYOUT,
        {
          name: 'Han Solo',
          array: ['ben'],
          object: { 'co-pilot': 'chewbacca' },
          height: 52
        },
        {
          scripts: [
            { name: 'FMS Triggered Script', param: 'data' },
            {
              name: 'FMS Triggered Script',
              phase: 'prerequest',
              param: { data: 2 }
            }
          ]
        }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'recordId',
        'modId',
        'scriptResult',
        'scriptError.prerequest',
        'scriptResult.prerequest',
        'scriptError'
      );
  });

  it('should allow you to specify scripts as an array with a merge response', () => {
    return expect(
      client.create(
        process.env.LAYOUT,
        {
          name: 'Han Solo',
          array: ['ben'],
          object: { 'co-pilot': 'chewbacca' },
          height: 52
        },
        {
          script: 'FMS Triggered Script',
          merge: true,
          scripts: [{ name: 'FMS Triggered Script', phase: 'prerequest' }]
        }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'recordId',
        'name',
        'array',
        'object',
        'height',
        'modId',
        'scriptResult',
        'scriptError.prerequest',
        'scriptResult.prerequest',
        'scriptError'
      );
  });

  it('should sanitize parameters when creating a new record', () => {
    return expect(
      client.create(
        process.env.LAYOUT,
        {
          name: 'Han Solo',
          array: ['ben'],
          object: { 'co-pilot': 'chewbacca' },
          height: 52
        },
        {
          script: 'FMS Triggered Script',
          'script.param': 1,
          merge: true,
          scripts: [
            {
              name: 'FMS Triggered Script',
              param: { data: true },
              phase: 'prerequest'
            }
          ]
        }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'recordId',
        'name',
        'array',
        'object',
        'height',
        'modId',
        'scriptResult',
        'scriptError.prerequest',
        'scriptResult.prerequest',
        'scriptError'
      );
  });

  it('should accept both the default script parameters and a scripts array', () => {
    return expect(
      client.create(
        process.env.LAYOUT,
        {
          name: 'Han Solo',
          array: ['ben'],
          object: { 'co-pilot': 'chewbacca' },
          height: 52
        },
        {
          script: 'FMS Triggered Script',
          'script.param': 1,
          merge: true,
          scripts: [
            { name: 'FMS Triggered Script', phase: 'prerequest', param: 2 }
          ]
        }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'recordId',
        'name',
        'array',
        'object',
        'height',
        'modId',
        'scriptResult',
        'scriptError',
        'scriptError.prerequest',
        'scriptResult.prerequest'
      );
  });
});
