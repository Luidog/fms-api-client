'use strict';

const examples = [];

const store = responses =>
  responses.map(
    response =>
      typeof response === 'object' && response.recordId
        ? examples.push({ recordId: response.recordId })
        : null
  );

module.exports = { examples, store };
