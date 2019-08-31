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

describe('Edit Capabilities', () => {
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
      .then(() => done());
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

  it('should edit FileMaker records without fieldData', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(process.env.LAYOUT, response.recordId, {
          name: 'Luke Skywalker'
        })
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId');
  });

  it('should allow you to specify a timeout', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Darth Vader' })
        .then(response =>
          client.edit(
            process.env.LAYOUT,
            response.recordId,
            {
              name: 'Luke Skywalker'
            },
            {
              request: { timeout: 10 }
            }
          )
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should edit FileMaker records using fieldData', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(process.env.LAYOUT, response.recordId, {
          fieldData: { name: 'Luke Skywalker' }
        })
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId');
  });

  it('should edit FileMaker records with portalData', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(process.env.LAYOUT, response.recordId, {
          fieldData: { name: 'Han Solo' },
          portalData: { Vehicles: [{ 'Vehicles::name': 'Millenium Falcon' }] }
        })
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'newPortalRecordInfo');
  });

  it('should edit FileMaker records with portalData and allow portalData to be an array.', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(process.env.LAYOUT, response.recordId, {
          fieldData: { name: 'Han Solo' },
          portalData: {
            Vehicles: [
              { 'Vehicles::name': { name: 'Millenium Falcon' } },
              { 'Vehicles::name': 5 }
            ]
          }
        })
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'newPortalRecordInfo');
  });

  it('should reject bad data with an error', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Obi-Wan' })
        .then(response =>
          client.edit(process.env.LAYOUT, response.recordId, 'junk error')
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should return an object with merged filemaker and data properties', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(
          process.env.LAYOUT,
          response.recordId,
          {
            name: 'Luke Skywalker'
          },
          { merge: true }
        )
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId', 'name');
  });

  it('should allow you to run a script when editing a record', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(
          process.env.LAYOUT,
          response.recordId,
          {
            name: 'Han Solo'
          },
          { script: 'FMS Triggered Script' }
        )
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'scriptResult', 'scriptError');
  });

  it('should allow you to run a script via a scripts array when editing a record', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(
          process.env.LAYOUT,
          response.recordId,
          {
            name: 'Han Solo'
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
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'modId',
        'scriptResult',
        'scriptError.prerequest',
        'scriptResult.prerequest',
        'scriptError'
      );
  });

  it('should allow you to specify scripts as an array', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(
          process.env.LAYOUT,
          response.recordId,
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
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'modId',
        'scriptResult',
        'scriptError.prerequest',
        'scriptResult.prerequest',
        'scriptError'
      );
  });

  it('should allow you to specify scripts as an array with a merge response', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(
          process.env.LAYOUT,
          response.recordId,
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

  it('should sanitize parameters when creating a editing record', () => {
    return expect(
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(
          process.env.LAYOUT,
          response.recordId,
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
            error: true,
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
      client.create(process.env.LAYOUT, { name: 'Obi-Wan' }).then(response =>
        client.edit(
          process.env.LAYOUT,
          response.recordId,
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
