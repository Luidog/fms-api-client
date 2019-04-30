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
const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer();

http
  .createServer(function(req, res) {
    proxy.web(req, res, {
      target: process.env.SERVER
    });
  })
  .listen(9000);

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

  it('should accept no agent configuration', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
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
        'database',
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

  it('should not create an agent unless one is defined', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    return expect(
      client
        .save()
        .then(client => client.list(process.env.LAYOUT, { limit: 1 }))
        .then(response => global.AGENTS)
    ).to.eventually.be.undefined;
  });

  it('adjusts the request protocol according to the server', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
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
        'database',
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
      database: process.env.DATABASE,
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
        'database',
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
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    return expect(
      client.save().then(client => global.AGENTS[client.agent.global])
    ).to.eventually.be.an('object');
  });

  it('should destory the agent when the client is deleted', () => {
    let globalId = '';
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    return expect(
      client
        .save()
        .then(client => {
          globalId = client.agent.global;
          return client.destroy();
        })
        .then(() => global.AGENTS[globalId])
    ).to.eventually.be.undefined;
  });

  it('should create a http agent', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
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
        'database',
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
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: true,
      timeout: 2500
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
        'database',
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

  it('should use a timeout if one is set', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: true,
      timeout: 10
    });
    return expect(
      client
        .save()
        .then(client => client.list(process.env.LAYOUT, { limit: 1 }))
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .with.any.keys('message', 'code');
  });

  it('should use a proxy if one is set', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER.replace('https://', 'http://'),
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: true,
      proxy: {
        host: '127.0.0.1',
        port: 9000
      }
    });
    return expect(
      client
        .save()
        .then(client => client.list(process.env.LAYOUT, { limit: 1 }))
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .with.any.keys('data');
  });

  it('should automatically recreate an agent if one is deleted', () => {
    let globalId;
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: true,
      agent: { rejectUnauthorized: true }
    });
    return expect(
      client
        .save()
        .then(client => {
          globalId = client.agent.global;
          delete global.AGENTS[globalId];
          return client.list(process.env.LAYOUT, { limit: 1 });
        })
        .then(response => {
          response.agent = global.AGENTS[globalId];
          return response;
        })
    )
      .to.eventually.be.an('object')
      .with.any.keys('data', 'agent')
      .and.property('agent')
      .is.an('object');
  });
});
