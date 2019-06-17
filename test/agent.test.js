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

const { Filemaker } = require('../index.js');

chai.use(chaiAsPromised);

describe('Agent Configuration Capabilities', () => {
  let database, client;
  before(done => {
    environment.config({ path: './test/.env' });
    varium(process.env, './test/env.manifest');
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
      .that.has.all.keys('_schema', '_id', 'data', 'agent', 'name')
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'concurrency',
        'connection',
        'queue',
        'delay',
        'pending',
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
        .then(response => global.FMS_API_CLIENT)
    )
      .to.eventually.be.an('object')
      .to.not.contain.key('AGENTS');
  });

  it('should adjust the request protocol according to the server', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER.replace('https://', 'http://'),
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      timeout: 5000
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys('_schema', '_id', 'data', 'agent', 'name')
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'agent',
        'connection',
        'concurrency',
        'delay',
        'pending',
        'queue',
        'global',
        'protocol',
        'proxy',
        'timeout'
      )
      .and.property('protocol')
      .to.equal('http');
  });

  it('should create an https agent', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys('_schema', '_id', 'data', 'agent', 'name')
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'agent',
        'concurrency',
        'connection',
        'delay',
        'global',
        'pending',
        'protocol',
        'proxy',
        'queue',
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
      client
        .save()
        .then(client => client.list(process.env.LAYOUT, { limit: 1 }))
        .then(response => global.FMS_API_CLIENT.AGENTS[client.agent.global])
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
        .then(client => client.list(process.env.LAYOUT, { limit: 1 }))
        .then(response => {
          globalId = client.agent.global;
          return client.destroy();
        })
        .then(() => global.FMS_API_CLIENT.AGENTS[globalId])
    ).to.eventually.be.undefined;
  });

  it('should create an http agent', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER.replace('https://', 'http://'),
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    return expect(client.save())
      .to.eventually.be.a('object')
      .that.has.all.keys('_schema', '_id', 'data', 'agent', 'name')
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'agent',
        'concurrency',
        'connection',
        'delay',
        'global',
        'pending',
        'protocol',
        'proxy',
        'queue',
        'timeout'
      )
      .and.property('agent')
      .to.be.a('object')
      .to.have.any.keys('rejectUnauthorized');
  });

  it('should use a proxy if one is set', () => {
    http
      .createServer(function(req, res) {
        proxy.web(req, res, {
          target: process.env.SERVER
        });
      })
      .listen(9000);

    client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: true,
      agent: { rejectUnauthorized: false },
      proxy: {
        host: '127.0.0.1',
        port: 9000
      }
    });
    return expect(
      client
        .save()
        .then(client => client.list(process.env.LAYOUT, { limit: 1 }))
    )
      .to.eventually.be.an('object')
      .with.any.keys('data');
  });

  it('should require the http protocol', () => {
    let client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      usage: true
    });
    return expect(
      client
        .save()
        .then(client => {
          client.agent.connection.server = process.env.SERVER.replace(
            'https://',
            'fmp://'
          );
          return client.login();
        })
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .with.any.keys('message');
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
      .that.has.all.keys('_schema', '_id', 'data', 'agent', 'name')
      .and.property('agent')
      .to.be.a('object')
      .to.have.all.keys(
        '_schema',
        'protocol',
        'connection',
        'global',
        'proxy',
        'timeout',
        'agent',
        'concurrency',
        'delay',
        'pending',
        'queue'
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
});
