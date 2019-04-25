'use strict';

const { log, store } = require('./services');

//#product-info-example
const productInfo = client =>
  client.productInfo().then(result => log('product-info-example', result));
//#

//#databases-info-example
const databases = client =>
  client.databases().then(result => log('databases-info-example', result));
//#

const metadata = client =>
  Promise.all([productInfo(client), databases(client)]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { metadata };
