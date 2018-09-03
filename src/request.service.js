'use strict';

const axios = require('axios');
const FormData = require('form-data');
const _ = require('lodash');

const request = axios.create();

const sanitize = request => _.omit(request, ['params.request', 'data.request']);

const intercept = config =>
  config.params
    ? config.params.request
      ? Promise.resolve(sanitize(config))
      : sanitize(config)
    : sanitize(config);

const handleError = error => Promise.reject(error);

request.interceptors.request.use(intercept, handleError);

module.exports = { request, FormData };
