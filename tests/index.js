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
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      layout: process.env.LAYOUT
    });
    done();
  });

  it('should allow an instance to be saved.', () => {
    return expect(filemaker.save())
      .to.eventually.be.an('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'application',
        'server',
        'credentials',
        'version'
      );
  });
  it('should authenticate into FileMaker.', () => {
    return expect(filemaker.authenticate()).to.eventually.be.a('string');
  });
  it('should create FileMaker records.', () => {
    return expect(filemaker.create('Heroes', { name: 'Han Solo' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('errorCode', 'recordId', 'result')
      .and.have.property('errorCode', '0');
  });
  it('should update FileMaker records.', () => {
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
  it('should allow you to list FileMaker records', () => {
    return expect(filemaker.list('Heroes'))
      .to.eventually.be.a('object')
      .that.has.all.keys('errorCode', 'result', 'data')
      .and.property('data');
  });
  it('should allow you to modify the FileMaker list response', () => {
    return expect(filemaker.list('Heroes', { range: '2' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('errorCode', 'result', 'data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });
  it('should allow allow a list response to be set with numbers', () => {
    return expect(filemaker.list('Heroes', { range: 2 }))
      .to.eventually.be.a('object')
      .that.has.all.keys('errorCode', 'result', 'data')
      .and.property('data')
      .to.have.a.lengthOf(2);
  });
  it('should allow you to find FileMaker records', () => {
    return expect(
      filemaker.find(
        'Heroes',

        {
          name: 'Luke Skywalker'
        },
        { range: 1 }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('errorCode', 'result', 'data')
      .and.property('data')
      .to.have.a.lengthOf(1);
  });
  it('should allow you to set FileMaker globals', () => {
    return expect(filemaker.globals({ ship: 'Millenium Falcon' }))
      .to.eventually.be.a('object')
      .that.has.all.keys('errorCode', 'result');
  });
});
