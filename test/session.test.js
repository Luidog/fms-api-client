'use strict';

/* global describe before after it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');
const { admin } = require('./admin');

/* eslint-enable */

const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const environment = require('dotenv');
const varium = require('varium');
const { connect } = require('marpat');
const { Filemaker } = require('../index.js');

const delay = parseInt(process.env.ADMIN_DELAY);

const manifestPath = path.join(__dirname, './env.manifest');

chai.use(chaiAsPromised);

describe('Session Capabilities', () => {
  describe('Session Efficency', () => {
    let database;
    let client;
    const name = 'testing-client';

    before(done => {
      environment.config({ path: './test/.env' });
      varium({ manifestPath });
      connect('nedb://memory')
        .then(db => {
          database = db;
          return database.dropDatabase();
        })
        .then(() => {
          client = Filemaker.create({
            name,
            database: process.env.DATABASE,
            server: process.env.SERVER,
            user: process.env.USERNAME,
            concurrency: 25,
            password: process.env.PASSWORD
          });
          return client.save();
        })
        .then(client => admin.login())
        .then(() => admin.sessions.drop({ userName: process.env.USERNAME }))
        .then(() => setTimeout(() => done(), delay));
    });

    after(done => {
      admin
        .logout()
        .then(() => done())
        .catch(error => done(new Error(error.response.data.messages[0].text)));
    });

    it('should reuse sessions when they are avalable', () => {
      const wait = 5000;
      const repetition = 5;
      const results = [];
      const chain = client =>
        new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            client
              .find(
                process.env.LAYOUT,
                { id: '*' },
                { omit: true, name: 'Darth Vader' }
              )
              .then(result => {
                results.push(results);
                if (results.length >= repetition) {
                  clearInterval(interval);
                  resolve({ client, results });
                }
              });
          }, wait);
        });

      return expect(
        Filemaker.findOne({ name })
          .then(client => chain(client))
          .then(
            ({ client, results }) =>
              new Promise(resolve =>
                setTimeout(() => resolve({ client, results }), 12000)
              )
          )
          .then(() =>
            admin.sessions.find({
              userName: process.env.USERNAME
            })
          )
      )
        .to.eventually.be.a('array')
        .to.have.a.lengthOf(1);
    });
  });

  describe('Session Concurrency', () => {
    let database;
    let client;
    const name = 'testing-client';

    before(done => {
      environment.config({ path: './test/.env' });
      varium({ manifestPath });
      connect('nedb://memory')
        .then(db => {
          database = db;
          return database.dropDatabase();
        })
        .then(() => {
          client = Filemaker.create({
            name,
            database: process.env.DATABASE,
            server: process.env.SERVER,
            user: process.env.USERNAME,
            concurrency: 25,
            password: process.env.PASSWORD
          });
          return client.save();
        })
        .then(client => admin.login())
        .then(() => admin.sessions.drop({ userName: process.env.USERNAME }))
        .then(() => setTimeout(() => done(), delay))
        .catch(error => done(error));
    });

    after(done => {
      admin
        .logout()
        .then(() => done())
        .catch(error => done(new Error(error.response.data.messages[0].text)));
    });

    it('should create new sessions to prevent request collisions', () => {
      const wait = 1000;
      let current = 0;
      const repetition = 5;
      const results = [];
      const chain = client =>
        new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            current = current + 1;
            if (current <= repetition) {
              client
                .script(process.env.LAYOUT, 'Pause Script', {
                  pause: 5
                })
                .then(result => {
                  results.push(results);
                  if (results.length >= repetition) {
                    resolve({ client, results });
                  }
                });
            } else {
              clearInterval(interval);
            }
          }, wait);
        });

      return expect(
        Filemaker.findOne({ name })
          .then(client => chain(client))
          .then(
            ({ client, results }) =>
              new Promise(resolve =>
                setTimeout(() => resolve({ client, results }), 12000)
              )
          )
          .then(() =>
            admin.sessions.find({
              userName: process.env.USERNAME
            })
          )
      )
        .to.eventually.be.a('array')
        .to.have.a.lengthOf(repetition);
    });

    it('should be able to create a large number of records without an initial session', () => {
      const creates = new Array(100)
        .fill()
        .map((n, i) =>
          client.create(process.env.LAYOUT, { name: `Han Solo ${i}` })
        );

      return expect(Promise.all(creates))
        .to.eventually.be.a('array')
        .and.to.have.length(100)
        .and.property(0)
        .to.be.an('object')
        .that.has.all.keys('recordId', 'modId');
    });
  });
});
