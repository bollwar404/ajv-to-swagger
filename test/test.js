'use strict';

const { assert } = require('chai');

const convertor = require('../index');

const someReplySchema = {
  title: 'GIRLS_IN_LOC',
  description: 'Girls in location',
  type: 'object',
  properties: {
    currency: { type: 'string', minLength: 3, maxLength: 3 },
    id: { type: 'string', minLength: 36, maxLength: 36 },
    version: { enum: [2] },
    env: { type: 'integer', minimum: 1, maximum: 10000 },
    fromCache: { type: 'boolean' },
    rates: {
      type: 'object',
      example: { USDEUR: '0.881367883', USDRUB: '67.905200000', USDUAH: '28.409090909' },
      patternProperties: {
        '^[A-Z]{6}$': { type: 'string' },
      },
      additionalProperties: false,
    },
    girls: {
      type: 'array',
      items:
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            height: { type: 'integer' },
            boobs: { type: 'integer' },
            stars: { type: 'integer' },
            age: { type: 'integer' },
            continued: { type: 'boolean' },
          },
          additionalProperties: false,
          required: ['id', 'boobs'],
        },
    },
  },
  additionalProperties: false,
  required: ['id', 'version', 'currency'],
};

describe('convertSchema', () => {
  it('should covert schema', () => {
    const converted = convertor.convertSchema(someReplySchema);
    assert.isOk(converted);
  });
});
