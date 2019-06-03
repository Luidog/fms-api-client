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

describe('Script Queue Capabilities', () => {
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

  it('should allow you to trigger a script with an object', () => {
    return expect(
      client.run(process.env.LAYOUT, {
        name: 'FMS Triggered Script',
        phase: 'presort',
        param: {
          name: 'han',
          number: 102,
          object: { child: 'ben' },
          array: ['leia', 'chewbacca']
        }
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to trigger a script with an object', () => {
    return expect(
      client.run(process.env.LAYOUT, {
        name: 'FMS Triggered Script',
        phase: 'presort',
        param: {
          name: 'han',
          number: 102,
          object: { child: 'ben' },
          array: ['leia', 'chewbacca']
        }
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to trigger a script with an array', () => {
    return expect(
      client.run(process.env.LAYOUT, [
        {
          name: 'FMS Triggered Script',
          param: {
            name: 'han',
            number: 102,
            object: { child: 'ben' },
            array: ['leia', 'chewbacca']
          }
        }
      ])
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to trigger a script via a string', () => {
    return expect(client.run(process.env.LAYOUT, 'FMS Triggered Script'))
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to specify a timeout', () => {
    return expect(
      client
        .run(
          process.env.LAYOUT,
          {
            name: 'FMS Triggered Script',
            param: {
              name: 'han',
              number: 102,
              object: { child: 'ben' },
              array: ['leia', 'chewbacca']
            }
          },
          {
            request: { timeout: 10 }
          }
        )
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .with.any.keys('message', 'code');
  });

  it('should allow you to trigger a script without specifying a parameter', () => {
    return expect(client.run(process.env.LAYOUT, 'FMS Triggered Script'))
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to trigger a script specifying a string as a parameter', () => {
    return expect(
      client.run(process.env.LAYOUT, 'FMS Triggered Script', 'string-here')
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to trigger a script specifying a number as a parameter', () => {
    return expect(client.run(process.env.LAYOUT, 'FMS Triggered Script', 1))
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to trigger a script specifying an object as a parameter', () => {
    return expect(
      client.run(process.env.LAYOUT, 'FMS Triggered Script', {
        object: true
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should reject a script that does not exist', () => {
    return expect(
      client.run(process.env.LAYOUT, 'Made up Script').catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should allow return a result even if a script returns an error', () => {
    return expect(
      client.run(process.env.LAYOUT, 'Error Script').catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should parse script results if the results are json', () => {
    return expect(
      client.run(process.env.LAYOUT, {
        name: 'FMS Triggered Script',
        param: 'Han'
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should not parse script results if the results are not json', () => {
    return expect(client.run(process.env.LAYOUT, { name: 'Non JSON Script' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should remove an expired token', () => {
    client.connection.token = `${client.connection.token}-error`;
    return expect(
      client
        .run(process.env.LAYOUT, {
          name: 'FMS Triggered Script',
          param: {
            name: 'han',
            number: 102,
            object: { child: 'ben' },
            array: ['leia', 'chewbacca']
          }
        })
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
