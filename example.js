const { connect } = require('marpat');
const { Filemaker } = require('./filemaker');
const environment = require('dotenv');
const varium = require('varium');

environment.config({ path: './tests/.env' });

varium(process.env, './tests/env.manifest');

/**
 * Connect must be called before the filemaker class is instiantiated. This connect uses Marpat. Marpat is a fork of
 * Camo. much love to https://github.com/scottwrobinson for his creation and maintenance of Camo.
 * My fork of Camo - Marpat is designed to allow the use of multiple datastores with the focus on encrypted storage.
 * @param  {String} url
 * @return {Promise}           A database.
 */
connect('nedb://memory').then(db => {
  /**
   * The client is the FileMaker class. The class then offers methods designed to
   * make it easier to integrate into filemaker
   */
  const client = Filemaker.create({
    application: process.env.APPLICATION,
    server: process.env.SERVER,
    _username: process.env.USERNAME,
    _password: process.env.PASSWORD,
    _layout: process.env.LAYOUT
  });

  client
    .save()
    .then(filemaker => {
      filemaker
        .create('Heroes', { name: 'Anakin Skywalker' })
        .then(response =>
          filemaker.create('Heroes', { name: 'Luke Skywalker' })
        )
        .then(response =>
          filemaker.create('Heroes', { name: 'Leia Skywalker' })
        )
        .then(response =>
          filemaker.create('Heroes', { name: 'Ben Skywalker' })
        );
      return filemaker;
    })
    .then(filemaker => {
      filemaker
        .list('Heroes', { range: 5 })
        .then(response => filemaker.fieldData(response.data))
        .then(response => console.log('A Long Time Ago', response))
        .catch(error => console.log('That is no moon...', error));

      filemaker
        .create('Heroes', { name: 'Anakin Skywalker' })
        .then(response =>
          console.log('Jedi business, go back to your drinks!', response)
        )
        .catch(error => console.log('That is no moon...', error));

      filemaker
        .globals({ ship: 'Millenium Falcon' })
        .then(response =>
          console.log(
            'Made the Kessel Run in less than twelve parsecs.',
            response
          )
        )
        .catch(error => console.log('That is no moon...', error));

      return filemaker;
    })
    .then(filemaker => {
      filemaker
        .find('Heroes', [{ name: 'Anakin Skywalker' }], { range: 1 })
        .then(response => filemaker.recordId(response.data))
        .then(recordIds =>
          filemaker.edit('Heroes', recordIds[0], { name: 'Darth Vader' })
        )
        .then(response =>
          console.log('I find your lack of faith disturbing', response)
        )
        .catch(error => console.log('That is no moon...darth', error));
      return filemaker;
    })
    .then(filemaker => {
      filemaker
        .find('Heroes', [{ name: 'Anakin Skywalker' }], { range: '1' })
        .then(response => filemaker.recordId(response.data[0]))
        .then(response => {
          console.log(response);
          return response;
        })
        .then(recordId => filemaker.delete('Heroes', recordId))
        .then(response => console.log('Fin.', response))
        .catch(error => console.log('That is no moon...', error));
    });
});
