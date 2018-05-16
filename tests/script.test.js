const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../filemaker');
const { expect, should } = require('chai');

chai.use(chaiAsPromised);

describe('Client Script Capability', () => {
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

  it('should allow you to trigger a script in FileMaker', () => {
    return expect(
      filemaker.script('example script', 'Heroes', {
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
    return expect(filemaker.script('example script', 'Heroes', 'text'))
      .to.eventually.be.a('object')
      .that.has.all.keys('result');
  });
});
