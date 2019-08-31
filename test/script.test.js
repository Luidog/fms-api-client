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

describe('Single Script Capabilities', () => {
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

  it('should allow you to trigger a script', () => {
    return expect(
      client.script(process.env.LAYOUT, 'FMS Triggered Script', {
        name: 'han',
        number: 102,
        object: { child: 'ben' },
        array: ['leia', 'chewbacca']
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError');
  });

  it('should allow you to specify a timeout', () => {
    return expect(
      client
        .script(
          process.env.LAYOUT,
          'FMS Triggered Script',
          {
            name: 'han',
            number: 102,
            object: { child: 'ben' },
            array: ['leia', 'chewbacca']
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

  it('should allow you to trigger a script specifying a string as a parameter', () => {
    return expect(
      client.script(process.env.LAYOUT, 'FMS Triggered Script', 'string-here')
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError');
  });

  it('should allow you to trigger a script specifying a number as a parameter', () => {
    return expect(client.script(process.env.LAYOUT, 'FMS Triggered Script', 1))
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError');
  });

  it('should allow you to trigger a script specifying an object as a parameter', () => {
    return expect(
      client.script(process.env.LAYOUT, 'FMS Triggered Script', {
        object: true
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError');
  });

  it('should allow you to trigger a script specifying an array as a parameter', () => {
    return expect(client.script(process.env.LAYOUT, 'FMS Triggered Script', []))
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError');
  });

  it('should allow you to trigger a script without a parameter', () => {
    return expect(client.script(process.env.LAYOUT, 'FMS Triggered Script'))
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError');
  });

  it('should reject a script that does not exist', () => {
    return expect(
      client.script(process.env.LAYOUT, 'Made up Script').catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should parse script results if the results are json', () => {
    return expect(
      client.script(process.env.LAYOUT, 'FMS Triggered Script', { name: 'Han' })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError')
      .and.property('scriptResult')
      .to.be.a('object');
  });

  it('should not parse script results if the results are not json', () => {
    return expect(client.script(process.env.LAYOUT, 'Non JSON Script'))
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError')
      .and.property('scriptResult')
      .to.be.a('string');
  });
});

describe('General Script Capabilities', () => {
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

  it('should allow you to trigger a script in a find', () => {
    return expect(
      client.find(
        process.env.LAYOUT,
        { id: '*' },
        { script: 'FMS Triggered Script' }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data', 'dataInfo');
  });

  it('should allow you to trigger a script in a list', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        limit: 2,
        script: 'FMS Triggered Script'
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data', 'dataInfo');
  });

  it('should reject a script that does not exist', () => {
    return expect(
      client
        .list(process.env.LAYOUT, {
          limit: 2,
          script: 'Made up Script'
        })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should allow return a result even if a script returns an error', () => {
    return expect(
      client
        .list(process.env.LAYOUT, {
          limit: 2,
          script: 'Error Script'
        })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data', 'dataInfo');
  });

  it('should parse script results if the results are json', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        limit: 2,
        scripts: [{ name: 'FMS Triggered Script', param: { name: 'Han' } }]
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data', 'dataInfo')
      .and.property('scriptResult')
      .to.be.a('object');
  });

  it('should not parse script results if the results are not json', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        limit: 2,
        scripts: [{ name: 'Non JSON Script', param: { name: 'Han' } }]
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data', 'dataInfo')
      .and.property('scriptResult')
      .to.be.a('string');
  });

  it('should parse an array of scripts', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        limit: 2,
        scripts: [{ name: 'FMS Triggered Script', param: { name: 'Han' } }]
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data', 'dataInfo')
      .and.property('scriptResult')
      .to.be.a('object');
  });

  it('should trigger scripts on all three script phases', () => {
    return expect(
      client.list(process.env.LAYOUT, {
        limit: 2,
        scripts: [
          {
            name: 'FMS Triggered Script',
            param: { name: 'Han' },
            phase: 'prerequest'
          },
          { name: 'FMS Triggered Script', param: { name: 'Han' } },
          {
            name: 'FMS Triggered Script',
            param: { name: 'Han' },
            phase: 'presort'
          }
        ]
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys(
        'scriptResult.prerequest',
        'scriptError.prerequest',
        'scriptResult.presort',
        'scriptError.presort',
        'scriptError',
        'dataInfo',
        'scriptResult',
        'data'
      )
      .and.property('scriptResult')
      .to.be.a('object');
  });
});
