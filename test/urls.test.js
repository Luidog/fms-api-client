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
const { urls } = require('../src/utilities');
const { Filemaker } = require('../index.js');
chai.use(chaiAsPromised);

describe('Data API URL Construction Capabilities', () => {
  let database, client;
  before(done => {
    environment.config({ path: './test/.env' });
    varium(process.env, './test/env.manifest');
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
  describe('Get URL Construction', () => {
    it('should generate a get request url', () => {
      return expect(
        urls.create(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.create(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT
        )
      ).to.be.a('string');
    });
  });
  describe('Update URL Construction', () => {
    it('should generate a record update url', () => {
      return expect(
        client
          .create(process.env.LAYOUT, { name: 'Han Solo' })
          .then(result =>
            urls.update(
              process.env.SERVER,
              process.env.DATABASE,
              process.env.LAYOUT,
              result.recordId,
              process.env.VERSION
            )
          )
      ).to.eventually.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        client
          .create(process.env.LAYOUT, { name: 'Han Solo' })
          .then(result =>
            urls.update(
              process.env.SERVER,
              process.env.DATABASE,
              process.env.LAYOUT,
              result.recordId
            )
          )
      ).to.eventually.be.a('string');
    });
  });
  describe('Delete URL Construction', () => {
    it('should generate a record delete url', () => {
      return expect(
        client
          .create(process.env.LAYOUT, { name: 'Han Solo' })
          .then(result =>
            urls.update(
              process.env.SERVER,
              process.env.DATABASE,
              process.env.LAYOUT,
              result.recordId,
              process.env.VERSION
            )
          )
      ).to.eventually.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        client
          .create(process.env.LAYOUT, { name: 'Han Solo' })
          .then(result =>
            urls.delete(
              process.env.SERVER,
              process.env.DATABASE,
              process.env.LAYOUT,
              result.recordId
            )
          )
      ).to.eventually.be.a('string');
    });
  });
  describe('Get URL Construction', () => {
    it('should generate a get record url', () => {
      return expect(
        client
          .create(process.env.LAYOUT, { name: 'Han Solo' })
          .then(result =>
            urls.update(
              process.env.SERVER,
              process.env.DATABASE,
              process.env.LAYOUT,
              result.recordId,
              process.env.VERSION
            )
          )
      ).to.eventually.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        client
          .create(process.env.LAYOUT, { name: 'Han Solo' })
          .then(result =>
            urls.get(
              process.env.SERVER,
              process.env.DATABASE,
              process.env.LAYOUT,
              result.recordId
            )
          )
      ).to.eventually.be.a('string');
    });
  });
  describe('List URL Construction', () => {
    it('should generate a list records url', () => {
      return expect(
        urls.list(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.list(process.env.SERVER, process.env.DATABASE, process.env.LAYOUT)
      ).to.be.a('string');
    });
  });
  describe('Find URL Construction', () => {
    it('should generate a find url', () => {
      return expect(
        urls.find(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.find(process.env.SERVER, process.env.DATABASE, process.env.LAYOUT)
      ).to.be.a('string');
    });
  });
  describe('Logout URL Construction', () => {
    it('should generate a logout url', () => {
      return expect(
        urls.logout(
          process.env.SERVER,
          process.env.DATABASE,
          'not-a-real-token',
          process.env.LAYOUT,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.find(
          process.env.SERVER,
          process.env.DATABASE,
          'not-a-real-token',
          process.env.LAYOUT
        )
      ).to.be.a('string');
    });
  });
  describe('Globals URL Construction', () => {
    it('should generate a global url', () => {
      return expect(
        urls.globals(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.globals(process.env.SERVER, process.env.DATABASE)
      ).to.be.a('string');
    });
  });
  describe('Logout URL Construction', () => {
    it('should generate a logout url', () => {
      return expect(
        urls.logout(
          process.env.SERVER,
          process.env.DATABASE,
          'some-token',
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.logout(process.env.SERVER, process.env.DATABASE, 'some-token')
      ).to.be.a('string');
    });
  });
  describe('Upload URL Construction', () => {
    it('should generate a upload url', () => {
      return expect(
        urls.upload(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          '1234',
          'image-upload',
          '1',
          process.env.VERSION
        )
      ).to.be.a('string');
    });
    it('should not require a repetition', () => {
      return expect(
        urls.upload(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          '1234',
          'image-upload',
          undefined,
          process.env.VERSION
        )
      ).to.be.a('string');
    });
    it('should not require a version', () => {
      return expect(
        urls.upload(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          '1234',
          'image-upload',
          '1'
        )
      ).to.be.a('string');
    });
  });
  describe('Authentication URL Construction', () => {
    it('should generate a authentication url', () => {
      return expect(
        urls.authentication(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.authentication(process.env.SERVER, process.env.DATABASE)
      ).to.be.a('string');
    });
  });
  describe('Database Layouts Metadata URL Construction', () => {
    it('should generate a database layouts metadata url', () => {
      return expect(
        urls.layouts(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.layouts(process.env.SERVER, process.env.DATABASE)
      ).to.be.a('string');
    });
  });
  describe('Layout Metadata URL Construction', () => {
    it('should generate a layout metadata url', () => {
      return expect(
        urls.layout(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.layout(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT
        )
      ).to.be.a('string');
    });
  });
  describe('Database Scripts Metadata URL Construction', () => {
    it('should generate a database scripts metadata url', () => {
      return expect(
        urls.scripts(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.scripts(process.env.SERVER, process.env.DATABASE)
      ).to.be.a('string');
    });
  });
  describe('Duplicate Record URL Construction', () => {
    it('should generate a duplicate record url', () => {
      return expect(
        urls.duplicate(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          '1234',
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.duplicate(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          '1234'
        )
      ).to.be.a('string');
    });
  });
  describe('Product Info URL Construction', () => {
    it('should generate a product Info metadata url', () => {
      return expect(
        urls.productInfo(process.env.SERVER, process.env.VERSION)
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(urls.productInfo(process.env.SERVER)).to.be.a('string');
    });
  });
  describe('Server Databases Metadata URL Construction', () => {
    it('should generate a server databases metadata url', () => {
      return expect(
        urls.databases(process.env.SERVER, process.env.VERSION)
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(urls.databases(process.env.SERVER)).to.be.a('string');
    });
  });
  describe('Run a Script URL Construction', () => {
    it('should generate a server databases metadata url', () => {
      return expect(
        urls.script(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          'FMS Triggered Script',
          process.env.VERSION
        )
      ).to.be.a('string');
    });

    it('should not require a version', () => {
      return expect(
        urls.script(
          process.env.SERVER,
          process.env.DATABASE,
          process.env.LAYOUT,
          'FMS Triggered Script',
          process.env.VERSION
        )
      ).to.be.a('string');
    });
  });
});
