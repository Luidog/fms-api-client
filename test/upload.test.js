/* global describe before after it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const path = require('path');
const fs = require('fs');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../index.js');

const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

describe('File Upload Capabilities', () => {
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

  it('should allow you to specify a timeout', () => {
    return expect(
      client
        .upload(
          './assets/placeholder.md',
          process.env.LAYOUT,
          'image',
          undefined,
          {
            request: { timeout: 10 }
          }
        )
        .catch(error => error)
    )
      .to.eventually.be.an('object')
      .with.any.keys('message', 'code');
  });

  it('should allow you to upload a file to a new record', () => {
    return expect(
      client.upload('./assets/placeholder.md', process.env.LAYOUT, 'image')
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', '1');
  });

  it('should allow you to upload a buffer to a new record', () => {
    const buffer = {
      buffer: fs.readFileSync('./assets/placeholder.md'),
      name: 'placeholder.md'
    };
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record => client.upload(buffer, process.env.LAYOUT, 'image'))
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', '1');
  });

  it('should allow you to upload a file to a specific container repetition', () => {
    return expect(
      client.upload(
        './assets/placeholder.md',
        process.env.CONTAINER_LAYOUT,
        'container',
        undefined,
        { fieldRepetition: 2 }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', '1');
  });

  it('should allow you to upload a buffer to a specific container repetition', () => {
    const buffer = {
      buffer: fs.readFileSync('./assets/placeholder.md'),
      name: 'placeholder.md'
    };
    return expect(
      client.upload(
        buffer,
        process.env.CONTAINER_LAYOUT,
        'container',
        undefined,
        {
          fieldRepetition: 2
        }
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', '1');
  });

  it('should reject with a message if it can not find the file to upload', () => {
    return expect(
      client
        .upload('./assets/none.md', process.env.LAYOUT, 'image')
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('message', 'code');
  });

  it('should allow you to upload a file to a specific record', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(
            './assets/placeholder.md',
            process.env.LAYOUT,
            'image',
            record.recordId
          )
        )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', '1');
  });

  it('should allow you to upload a buffer object to a specific record', () => {
    const buffer = {
      buffer: fs.readFileSync('./assets/placeholder.md'),
      name: 'placeholder.md'
    };
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(buffer, process.env.LAYOUT, 'image', record.recordId)
        )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', '1');
  });

  it('should allow you to upload a file to a specific record container repetition', () => {
    return expect(
      client
        .create(process.env.CONTAINER_LAYOUT, {})
        .then(record =>
          client.upload(
            './assets/placeholder.md',
            process.env.CONTAINER_LAYOUT,
            'container',
            record.recordId,
            { fieldRepetition: 2 }
          )
        )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', '1');
  });

  it('should allow you to upload a buffer to a specific record container repetition', () => {
    const buffer = {
      buffer: fs.readFileSync('./assets/placeholder.md'),
      name: 'placeholder.md'
    };
    return expect(
      client.create(process.env.CONTAINER_LAYOUT, {}).then(record =>
        client.upload(
          buffer,
          process.env.CONTAINER_LAYOUT,
          'container',
          record.recordId,
          {
            fieldRepetition: 2
          }
        )
      )
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('modId', 'recordId')
      .and.property('modId', '1');
  });

  it('should reject of the request is invalid', () => {
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(
            './assets/placeholder.md',
            'No layout',
            'image',
            record.recordId
          )
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject an empty buffer object', () => {
    const buffer = {};
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(buffer, 'No layout', 'image', record.recordId)
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject a null buffer object', () => {
    const buffer = null;
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(buffer, 'No layout', 'image', record.recordId)
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject a number instead of an object', () => {
    const buffer = 5;
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(buffer, 'No layout', 'image', record.recordId)
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject an object without a filename', () => {
    const buffer = { buffer: fs.readFileSync('./assets/placeholder.md') };
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(buffer, 'No layout', 'image', record.recordId)
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });

  it('should reject an object without a buffer', () => {
    const buffer = { name: 'placeholder.md' };
    return expect(
      client
        .create(process.env.LAYOUT, { name: 'Han Solo' })
        .then(record =>
          client.upload(buffer, 'No layout', 'image', record.recordId)
        )
        .catch(error => error)
    )
      .to.eventually.be.a('object')
      .that.has.all.keys('code', 'message');
  });
});
