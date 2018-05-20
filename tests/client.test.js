const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../filemaker');
const { expect, should } = require('chai');

chai.use(chaiAsPromised);

describe('Client Data Store', () => {
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
      password: process.env.PASSWORD
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
        'version'
      );
  });

  it('should allow an instance to be recalled', () => {
    return expect(Filemaker.findOne({}))
      .to.eventually.be.an('object')
      .that.has.all.keys(
        '_schema',
        'connection',
        '_id',
        'data',
        'application',
        'server',
        'version'
      );
  });
});
