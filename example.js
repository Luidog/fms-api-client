'use strict';

const environment = require('dotenv');
const varium = require('varium');
const colors = require('colors');
const { connect } = require('marpat');
const { Filemaker } = require('./filemaker');

environment.config({ path: './tests/.env' });

varium(process.env, './tests/env.manifest');

/**
 * Connect must be called before the filemaker class is instiantiated. This connect uses Marpat. Marpat is a fork of
 * Camo. much love to https://github.com/scottwrobinson for his creation and maintenance of Camo.
 * My fork of Camo - Marpat is designed to allow the use of multiple datastores with the focus on encrypted storage.
 * @param  {url} url a url string representing a datastore.
 * @param  {options} options an object representing datastore options. See Marpat for more info.
 * @return {Promise}           A database.
 */

connect('nedb://data').then(db => {
  /**
   * The client is the FileMaker class. The class then offers methods designed to
   * make it easier to integrate into filemaker's api.
   */

  const client = Filemaker.create({
    application: process.env.APPLICATION,
    server: process.env.SERVER,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    layout: process.env.LAYOUT
  });

  /**
   * A client can be used directly after saving it. It is also stored on the datastore
   * so that it can be reused later.
   */

  client
    .save()
    .then(client => {
      return Promise.all([
        client.create('Heroes', { name: 'Anakin Skywalker' }),
        client.create('Heroes', { name: 'Obi-Wan' }),
        client.create('Heroes', { name: 'Yoda' })
      ]).then(response => {
        console.group();
        console.log('A Long Time Ago...'.rainbow);
        console.log(response);
        console.groupEnd();
        return client;
      });
    })
    .then(client => {
      client
        .list('Heroes', { range: 5 })
        .then(response => client.fieldData(response.data))
        .then(response => {
          console.group();
          console.log(
            ' For my ally is the Force, and a powerful ally it is.'.underline
              .green
          );
          console.log(response);
          console.groupEnd();
        })
        .catch(error => {
          console.group();
          console.log('That is no moon...'.red);
          console.log(error);
          console.groupEnd();
        });

      client
        .globals({ ship: 'Millenium Falcon' })
        .then(response => {
          console.group();
          console.log(
            'Made the Kessel Run in less than twelve parsecs.'.underline.blue
          );
          console.log(response);
          console.groupEnd();
        })
        .catch(error => {
          console.group();
          console.log('That is no moon...'.red);
          console.log(error);
          console.groupEnd();
        });

      return client;
    })
    .then(client =>
      client
        .find('Heroes', [{ name: 'Anakin Skywalker' }], { range: 1 })
        .then(response => client.recordId(response.data))
        .then(recordIds =>
          client.edit('Heroes', recordIds[0], { name: 'Darth Vader' })
        )
        .then(response => {
          console.group();
          console.log('I find your lack of faith disturbing'.underline.red);
          console.log(response);
          console.groupEnd();
        })
        .catch(error => {
          console.group();
          console.log('That is no moon...'.red);
          console.log(error);
          console.groupEnd();
        })
    );
});

const rewind = () => {
  Filemaker.findOne().then(client => {
    client
      .find('Heroes', [{ id: '*' }], { range: 150 })
      .then(response => client.recordId(response.data))
      .then(response => {
        console.group();
        console.log('Be Kind.... Rewind.....'.rainbow);
        console.log(response);
        console.groupEnd();
        return response;
      })
      .then(recordIds =>
        recordIds.forEach(id => {
          client.delete('Heroes', id).catch(error => {
            console.group();
            console.log('That is no moon...'.red);
            console.log(error);
            console.groupEnd();
          });
        })
      );
  });
};

setTimeout(function() {
  rewind();
}, 10000);
