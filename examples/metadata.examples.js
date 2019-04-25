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

//#layouts-example
const layouts = client =>
  client.layouts().then(result => log('layouts-example', result));
//#

//#layout-details-example
const layout = client =>
  client
    .layout(process.env.LAYOUT)
    .then(result => log('layout-details-example', result));
//#

const metadata = client =>
  Promise.all([
    productInfo(client),
    databases(client),
    layouts(client),
    layout(client)
  ]).then(responses => {
    store(responses);
    return client;
  });

module.exports = { metadata };
