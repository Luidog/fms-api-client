const { connect } = require('marpat');
const { Filemaker } = require('./filemaker');

connect('nedb://data').then(db => {
  const filemaker = Filemaker.create({
    application: 'mock-application',
    server: 'https://mock-server.com',
    _username: 'obi-wan',
    _password: 'kenobi'
  });

  filemaker.save().then(client => console.log(client.toJSON()));
});
