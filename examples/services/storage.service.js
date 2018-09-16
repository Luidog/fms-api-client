'use strict';

const examples = [];

const store = responses =>
  Array.isArray(responses)
    ? responses.map(
        response =>
          typeof response === 'object' && response.recordId
            ? examples.push({ recordId: response.recordId })
            : null
      )
    : null;

module.exports = { examples, store };
