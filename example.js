const { connect } = require('marpat');
const { Filemaker } = require('./filemaker');

connect('nedb://data').then(db => {
  const filemaker = Filemaker.create({
    message: 'I will be a full blown client some day!'
  });

  filemaker.save().then(client => console.log(client.toJSON()));
});
