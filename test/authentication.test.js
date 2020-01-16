'use strict';

/* global describe before after beforeEach afterEach it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../index.js');

const sandbox = sinon.createSandbox();

const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

describe('Authentication Capabilities', () => {
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

  beforeEach(done => {
    client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    client.save().then(client => done());
  });

  afterEach(done => {
    sandbox.restore();
    return done();
  });

  after(done => {
    client
      .reset()
      .then(response => done())
      .catch(error => done());
  });

  it('should authenticate into FileMaker.', () => {
    return expect(client.login())
      .to.eventually.be.a('object')
      .that.has.all.keys('token', 'id');
  });

  it('should automatically request an authentication token', () => {
    return expect(
      client
        .create(process.env.LAYOUT, {})
        .then(record =>
          Promise.resolve(client.agent.connection.sessions[0].token)
        )
    ).to.eventually.be.a('string');
  });

  it('should reuse an open session', () => {
    return expect(
      client
        .create(process.env.LAYOUT, {})
        .then(record => client.agent.connection.sessions[0].token)
        .then(token => {
          client.create(process.env.LAYOUT, {});
          return token;
        })
        .then(token => token === client.agent.connection.sessions[0].token)
    ).to.eventually.be.true;
  });

  it('should log out of the filemaker.', () => {
    return expect(
      client
        .login()
        .then(token => client.logout())
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('messages', 'response');
  });

  it('should not attempt a logout if there is no valid token.', () => {
    return expect(client.logout().catch(error => error))
      .to.eventually.be.a('object')
      .that.has.all.keys('message');
  });

  it('should reject if the logout request fails', () => {
    return expect(
      client
        .login()
        .then(token => {
          client.agent.connection.sessions[0].token = 'invalid';
          return client;
        })
        .then(client => client.logout())
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject if the login request fails', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });

    sandbox
      .stub(client.agent.connection.credentials, 'password')
      .value('incorrect');

    return expect(
      client
        .save()
        .then(client => client.login())
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message')
      .and.property('code')
      .to.equal('212');
  });

  it('should reject if it can not create a new data api session', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    sandbox
      .stub(client.agent.connection.credentials, 'password')
      .value('incorrect');
    return expect(
      client
        .save()
        .then(client => client.login())
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject if it can not create a new data api session with authentication', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    sandbox
      .stub(client.agent.connection.credentials, 'password')
      .value('incorrect');
    return expect(
      client
        .save()
        .then(client => client.list())
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('code', 'message');
  });

  it('should clear queued requests if it can not add a new data api session', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    sandbox
      .stub(client.agent.connection.credentials, 'password')
      .value('incorrect');
    return expect(
      client
        .save()
        .then(client => client.list())
        .catch(error => ({
          pending: client.agent.pending,
          queue: client.agent.queue,
          error
        }))
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('error', 'pending', 'queue')
      .and.to.have.property('pending')
      .to.be.an('array').and.to.be.empty;
  });

  it('should clear pending requests if it can not add a new data api session', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    sandbox
      .stub(client.agent.connection.credentials, 'password')
      .value('incorrect');
    return expect(
      client
        .save()
        .then(client => client.list())
        .catch(error => ({
          pending: client.agent.pending,
          queue: client.agent.queue,
          error
        }))
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('error', 'pending', 'queue')
      .and.to.have.property('queue')
      .to.be.an('array').and.to.be.empty;
  });

  it('should attempt to log out before being removed', () => {
    let called = false;
    sandbox.stub(client.agent.connection, 'end').callsFake(() => {
      called = true;
      return Promise.resolve(called);
    });

    return expect(
      client
        .login()
        .then(response => client.destroy())
        .then(response => {
          expect(called).to.equal(true);
          return response;
        })
    )
      .to.eventually.be.an('number')
      .and.equal(1);
  });

  it('should clear invalid sessions', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    sandbox
      .stub(client.agent.connection.credentials, 'password')
      .value('incorrect');
    sandbox
      .stub(client.agent.connection, 'authentication')
      .callsFake(({ headers, ...request }) => ({
        ...request,
        headers: {
          ...headers,
          Authorization: `Bearer Invalid`
        }
      }));
    return expect(
      client
        .login()
        .then(() => {
          client.agent.connection.sessions = [];
          return client.list(process.env.LAYOUT, { limit: 1 });
        })
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('message', 'code');
  });

  it('should open sessions with a custom agent automatically', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    let requestAgent;
    sandbox.stub(client.agent.connection, 'start').callsFake(agent => {
      requestAgent = agent;
      return Promise.reject(agent);
    });

    return expect(
      client
        .save()
        .then(client => client.list())
        .catch(error => {
          return requestAgent;
        })
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('httpsAgent')
      .and.property('httpsAgent')
      .to.have.any.keys('options')
      .and.property('options')
      .to.have.any.keys('rejectUnauthorized');
  });

  it('should open sessions with a custom agent on login', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    let requestAgent;
    sandbox.stub(client.agent.connection, 'start').callsFake(agent => {
      requestAgent = agent;
      return Promise.reject(agent);
    });

    return expect(
      client
        .save()
        .then(client => client.login())
        .catch(error => {
          return requestAgent;
        })
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('httpsAgent')
      .and.property('httpsAgent')
      .to.have.any.keys('options')
      .and.property('options')
      .to.have.any.keys('rejectUnauthorized');
  });

  it('should close sessions with a custom agent automatically', () => {
    const client = Filemaker.create({
      database: process.env.DATABASE,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      agent: { rejectUnauthorized: true }
    });
    let requestAgent;
    sandbox.stub(client.agent.connection, 'end').callsFake(agent => {
      requestAgent = agent;
      return Promise.reject(agent);
    });

    return expect(
      client
        .save()
        .then(client => client.logout())
        .catch(error => {
          return requestAgent;
        })
    )
      .to.eventually.be.an('object')
      .that.has.all.keys('httpsAgent')
      .and.property('httpsAgent')
      .to.have.any.keys('options')
      .and.property('options')
      .to.have.any.keys('rejectUnauthorized');
  });

  it('should catch the log out error before being removed if the login is not valid', () => {
    return expect(
      client.login().then(token => {
        client.agent.connection.sessions[0].token = 'invalid';
        return client.destroy();
      })
    )
      .to.eventually.be.an('number')
      .and.equal(1);
  });
});
