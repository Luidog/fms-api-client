'use strict';

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

describe('Agent Configuration Capabilities', () => {
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

  it('should accept no agent configuration', () => {
    let client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'agent',
        'name',
        'application',
        'server',
        'version'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'agent',
        'global',
        'protocol',
        'proxy',
        'timeout'
      )
      .and.property('agent').to.be.to.be.undefined;
  });

  it('adjusts the agent protocol according to the server', () => {
    let client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER.replace('https://', 'http://'),
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      timeout: 5000
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'agent',
        'name',
        'application',
        'server',
        'version'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'agent',
        'global',
        'protocol',
        'proxy',
        'timeout'
      )
      .and.property('protocol')
      .to.equal('http');
  });

  it('adjusts the request protocol according to the server', () => {
    let client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER.replace('https://', 'http://'),
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      timeout: 5000
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'agent',
        'name',
        'application',
        'server',
        'version'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'agent',
        'global',
        'protocol',
        'proxy',
        'timeout'
      )
      .and.property('protocol')
      .to.equal('http');
  });

  it('should create a https agent', () => {
    let client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'agent',
        'name',
        'application',
        'server',
        'version'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'agent',
        'global',
        'protocol',
        'proxy',
        'timeout'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.any.keys('rejectUnauthorized');
  });

  it('should use a created request agent', () => {
    let client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    return expect(
      client
        .save()
        .then(client => client.list(process.env.LAYOUT, { limit: 1 }))
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('data')
      .and.property('data')
      .to.be.a('array');
  });

  it('should create a http agent', () => {
    let client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER.replace('https://', 'http://'),
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'agent',
        'name',
        'application',
        'server',
        'version'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'agent',
        'global',
        'protocol',
        'proxy',
        'timeout'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.any.keys('rejectUnauthorized');
  });

  it('should accept a timeout property', () => {
    let client = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: true,
      timeout: 2500,
      agent: {
        keepAlive: true,
        rejectUnauthorized: false
      }
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'agent',
        'name',
        'application',
        'server',
        'version'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'protocol',
        'global',
        'proxy',
        'timeout',
        'agent'
      );
  });
});
