'use strict';

/* global describe it */

/* eslint-disable */

const assert = require('assert');
const { expect, should } = require('chai');

/* eslint-enable */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {
  pick,
  omit,
  parse,
  isJSON
} = require('../src/utilities/conversion.utilities');

chai.use(chaiAsPromised);

describe('Conversion Utility Capabilities', () => {
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
    describe('Long number handling', () => {
      const convertLongNums = true;
      it('it should return a string when given a string', () => {
        return expect(parse('A String', convertLongNums)).to.be.a('string');
      });
      it('it should return an object when given a stringified object', () => {
        return expect(
          parse(JSON.stringify({ name: 'Han Solo' }), convertLongNums)
        )
          .to.be.a('object')
          .and.to.include.keys('name');
      });
      it('it should convert long numbers to strings', () => {
        const parsed = parse(
          '{"longNum": 123456789012345678901234567890}',
          convertLongNums
        );
        const longNum = parsed.longNum;
        return expect(longNum).to.be.a('string');
      });
      it('it should leave short numbers as numbers', () => {
        const parsed = parse('{"shortNum": 123}', convertLongNums);
        const shortNum = parsed.shortNum;
        return expect(shortNum).to.be.a('number');
      });
      it('it should work with negative numbers', () => {
        const parsed = parse(
          '{"longNum": -123456789012345678901234567890}',
          convertLongNums
        );
        const longNum = parsed.longNum;
        return expect(longNum).to.eql('-123456789012345678901234567890');
      });
      it('it should work with short negative numbers', () => {
        const parsed = parse('{"longNum": -123}', convertLongNums);
        const longNum = parsed.longNum;
        return expect(longNum).to.eql(-123);
      });
      it('it should work with decimals', () => {
        const parsed = parse(
          '{"longNum": 1.12345678901234567890123456789}',
          convertLongNums
        );
        const longNum = parsed.longNum;
        return expect(longNum).to.eql('1.12345678901234567890123456789');
      });
      it('it should work with short decimals', () => {
        const parsed = parse('{"longNum": 1.123}', convertLongNums);
        const longNum = parsed.longNum;
        return expect(longNum).to.eql(1.123);
      });
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

describe('Filemaker Utility Capabilities', () => {
  describe('filter Results', () => {
    it('it should pick an array of properties while maintaing the array', () => {
      return expect(
        pick(
          [
            { name: 'Luke Skywalker', planet: 'tatooine' },
            { name: 'Luke Skywalker', planet: 'tatooine' }
          ],
          ['name']
        )
      )
        .to.be.a('array')
        .and.property('0')
        .to.be.a('object')
        .and.to.include.keys('name');
    });

    it('it should pick an array of properties while maintaing the object', () => {
      return expect(
        pick(
          { name: 'Luke Skywalker', affiliation: 'jedi', planet: 'tatooine' },
          ['name', 'planet']
        )
      )
        .to.be.a('object')
        .and.to.include.all.keys('planet', 'name');
    });
    it('it should pick a string property while maintaing the array', () => {
      return expect(
        pick(
          [
            { name: 'Luke Skywalker', planet: 'tatooine' },
            { name: 'Luke Skywalker', planet: 'tatooine' }
          ],
          'name'
        )
      )
        .to.be.a('array')
        .and.property('0')
        .to.be.a('object')
        .and.to.include.keys('name');
    });

    it('it should pick a string property while maintaing the object', () => {
      return expect(
        pick(
          { name: 'Luke Skywalker', affiliation: 'jedi', planet: 'tatooine' },
          'name'
        )
      )
        .to.be.a('object')
        .and.to.include.all.keys('name');
    });
  });
});
