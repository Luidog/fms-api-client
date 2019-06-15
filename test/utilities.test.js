/* global describe it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {
  omit,
  parse,
  isJSON
} = require('../src/utilities/conversion.utilities');

chai.use(chaiAsPromised);

describe('Utility Capabilities', () => {
  describe('Omit Utility', () => {
    it('it should remove properties while maintaing the array', () => {
      return expect(
        omit(
          [
            { name: 'Luke Skywalker', planet: 'tatooine' },
            { name: 'Luke Skywalker', planet: 'tatooine' }
          ],
          ['planet']
        )
      )
        .to.be.a('array')
        .and.property('0')
        .to.be.a('object')
        .and.to.not.include.keys('planet');
    });

    it('it should remove properties while maintaing the object', () => {
      return expect(
        omit({ name: 'Luke Skywalker', planet: 'tatooine' }, ['planet'])
      )
        .to.be.a('object')
        .and.to.not.include.keys('planet');
    });
  });
  describe('Parse Utility', () => {
    it('it should return a string when given a string', () => {
      return expect(parse('A String')).to.be.a('string');
    });
    it('it should return an object when given a stringified object', () => {
      return expect(parse(JSON.stringify({ name: 'Han Solo' })))
        .to.be.a('object')
        .and.to.include.keys('name');
    });
  });
  describe('isJSON Utility', () => {
    it('it should return true for an object', () => {
      return expect(isJSON({ object: true })).to.equal(true);
    });
    it('it should return true for an empty object', () => {
      return expect(isJSON({ object: true })).to.equal(true);
    });
    it('it should return true for a stringified object', () => {
      return expect(isJSON({})).to.equal(true);
    });
    it('it should return false for a number', () => {
      return expect(isJSON(1)).to.equal(false);
    });
    it('it should return false for undefined', () => {
      return expect(isJSON()).to.equal(false);
    });
    it('it should return false for a string', () => {
      return expect(isJSON('string')).to.equal(false);
    });
    it('it should return false for null', () => {
      return expect(isJSON(null)).to.equal(false);
    });
  });
});
