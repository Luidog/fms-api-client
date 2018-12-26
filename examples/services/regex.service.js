'use strict';

const fse = require('fs-extra');
const path = require('path');
const regex = /\<!(.*?)\->/g;
const readme = path.join(__dirname, '../../README.md');

fse.readFile(readme, 'utf8', (error, markdown) =>
  fse.writeFile(readme, markdown.replace(regex, ''))
);
