const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../filemaker');
const { expect, should } = require('chai');

chai.use(chaiAsPromised);

describe('FileMaker Data API Client', () => {
  let database = null;
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
      _username: process.env.USERNAME,
      _password: process.env.PASSWORD,
      _layout: process.env.LAYOUT
    });
    done();
  });

  it('should allow an instance to be saved.', () => {
    return expect(filemaker.save())
      .to.eventually.be.an('object')
      .that.has.all.keys(
        '_password',
        '_schema',
        '_username',
        '_connection',
        '_id',
        'application',
        'server',
        '_layout'
      );
  });
  it('should get an authentication token.', () => {
    return expect(filemaker.authenticate()).to.eventually.be.a('string');
  });
  it('should create FileMaker records.', () => {
    return expect(filemaker.create('Heroes', { name: 'Han Solo' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('errorCode', 'recordId', 'result')
      .and.have.property('errorCode', '0');
  });
  it('should edit FileMaker records.', () => {
    filemaker.create('Heroes', { name: 'Obi-Wan' }).then(response => {
      return expect(
        filemaker.edit('Heroes', response.recordId, { name: 'Luke Skywalker' })
      )
        .to.eventually.be.a('object')
        .that.has.all.keys('errorCode', 'result')
        .and.have.property('errorCode', '0');
    });
  });
  it('should delete FileMaker records.', () => {
    filemaker.create('Heroes', { name: 'Darth Vader' }).then(response => {
      return expect(filemaker.delete('Heroes', response.recordId))
        .to.eventually.be.a('object')
        .that.has.all.keys('errorCode', 'result')
        .and.have.property('errorCode', '0');
    });
  });
  it('should get a FileMaker specific record.', () => {
    filemaker.create('Heroes', { name: 'Darth Vader' }).then(response => {
      return expect(filemaker.get('Heroes', response.recordId))
        .to.eventually.be.a('object')
        .that.has.all.keys('errorCode', 'result', 'data');
    });
  });
  it('should allow you to modify the FileMaker List response', () => {
    return expect(filemaker.list('Heroes', { range: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('errorCode', 'result', 'data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });
});
