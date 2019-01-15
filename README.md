# ajv-to-swagger
Convert schema from AJV to Swagger

[![npm](https://img.shields.io/npm/v/ajv-to-swagger.svg)](https://npm.im/ajv-to-swagger)
[![license](https://img.shields.io/npm/l/ajv-to-swagger.svg)](https://npm.im/ajv-to-swagger)
[![Build Status](https://travis-ci.org/bollwar404/ajv-to-swagger.svg?branch=master)](https://travis-ci.org/bollwar404/ajv-to-swagger)
[![dependencies Status](https://david-dm.org/bollwar404/ajv-to-swagger/status.svg)](https://david-dm.org/bollwar404/ajv-to-swagger)
[![devDependencies Status](https://david-dm.org/bollwar404/ajv-to-swagger/dev-status.svg)](https://david-dm.org/bollwar404/ajv-to-swagger?type=dev)
[![Coverage Status](https://coveralls.io/repos/github/bollwar404/ajv-to-swagger/badge.svg?branch=master)](https://coveralls.io/github/bollwar404/ajv-to-swagger?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/bollwar404/ajv-to-swagger/badge.svg)](https://snyk.io/test/github/bollwar404/ajv-to-swagger)

That package converts ajv schemas (JSON schema draft 07) to Swagger schema (OpenApi 3).

All you need to do after conversion is to insert converted schema into corresponding place in swagger schema.

## Install

```bash
npm i ajv-to-swagger
```

## Usage

```js
const convertor = require('ajv-to-swagger');

// some kind of AJV schema which we provide as a response
const ajvResponseSchema = {
  type: 'object',
  properties: {
    currency: { type: 'string', minLength: 3, maxLength: 3 },
    id: { type: 'string', minLength: 36, maxLength: 36 },
    version: { enum: [2] },
    rates: {
      type: 'object',
      example: {
        USDEUR: '0.881367883',
        USDRUB: '67.905200000'
        },
      patternProperties: {
        '^[A-Z]{6}$': { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};
  
// make a draft of your schema without a response schema:
const baseSchema = 
    {
      "openapi": "3.0.1",
      "info": {
        "title": "defaultTitle",
        "description": "defaultDescription",
        "version": "0.1"
      },
      "servers": [
        {
          "url": "https://google.com"
        }
      ],
      "paths": {
        "/get/some/": {
          "get": {
            "description": "Auto generated using Swagger Inspector",
            "parameters": [
              {
                "name": "cs",
                "in": "query",
                "schema": {
                  "type": "string"
                },
                "example": "E"
              }
            ],
            "responses": {
              "200": {
                "description": "Auto generated using Swagger Inspector",
                "content": {
                  "application/json": {
                    "schema": {}
                  }
                }
              }
            },
            "servers": [
              {
                "url": "https://google.com"
              }
            ]
          },
          "servers": [
            {
              "url": "https://google.com"
            }
          ]
        }
      }
    };

const responseSwagger = convertor.convertSchema(ajvResponseSchema);

// put your schema where it needs to be
baseSchema.paths['/get/some/'].get.responses['200'].content['application/json'].schema = responseSwagger.schema;
```

Now `swaggerDoc` has a valid Swagger schema. You can serialize it in JSON and ouput when needed.

## Limitations

Currently `ajv-to-swagger` does not support many `patternProperties`, only one. But it is usually enough.
