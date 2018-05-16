const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../filemaker');
const { expect, should } = require('chai');

chai.use(chaiAsPromised);

describe('Client Upload Capability', () => {
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

  it('should allow you to upload a file to FileMaker', () => {
    return expect(
      filemaker.upload('./images/placeholder.md', 'Heroes', 'image')
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId')
      .and.property('modId', 1);
  });
});
