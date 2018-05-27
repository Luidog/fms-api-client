/* global describe before beforeEach it */

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

describe('Script Capabilities', () => {
  let database, filemaker;

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

  beforeEach(done => {
    filemaker = Filemaker.create({
      application: process.env.APPLICATION,
      server: process.env.SERVER,
      user: process.env.USERNAME,
      password: process.env.PASSWORD
    });
    done();
  });

  it('should allow you to trigger a script in FileMaker', () => {
    return expect(
      filemaker.script('FMS Triggered Script', process.env.LAYOUT, {
        name: 'han',
        number: 102,
        object: { child: 'ben' },
        array: ['leia', 'chewbacca']
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to trigger a script in FileMaker', () => {
    return expect(
      filemaker.script('FMS Triggered Script', process.env.LAYOUT, {
        name: 'han',
        number: 102,
        object: { child: 'ben' },
        array: ['leia', 'chewbacca']
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });

  it('should allow you to trigger a script in a find', () => {
    return expect(
      filemaker.find(
        process.env.LAYOUT,
        { id: '*' },
        { script: 'FMS Triggered Script' }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data');
  });

  it('should allow you to trigger a script in a list', () => {
    return expect(
      filemaker.list(process.env.LAYOUT, {
        limit: 2,
        script: 'FMS Triggered Script'
      })
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data');
  });

  it('should allow reject a script that does not exist', () => {
    return expect(
      filemaker
        .script(process.env.LAYOUT, {
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
      filemaker
        .list(process.env.LAYOUT, {
          limit: 2,
          script: 'Error Script'
        })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data');
  });

  it('should parse script results if the results are json', () => {
    return expect(
      filemaker
        .list(process.env.LAYOUT, {
          limit: 2,
          script: 'Error Script'
        })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data')
      .and.property('scriptResult')
      .to.be.a('object');
  });

  it('should not parse script results if the results are not json', () => {
    return expect(
      filemaker
        .list(process.env.LAYOUT, {
          limit: 2,
          script: 'Non JSON Script'
        })
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('scriptResult', 'scriptError', 'data');
  });
});
