# Convert form AJV to Swagger

[![npm](https://img.shields.io/npm/v/swagger-ajv-converter.svg)](https://npm.im/swagger-ajv-converter)
[![license](https://img.shields.io/npm/l/swagger-ajv-converter.svg)](https://npm.im/swagger-ajv-converter)
[![Build Status](https://travis-ci.org/bollwar404/swagger-ajv-converter.svg?branch=master)](https://travis-ci.org/bollwar404/swagger-ajv-converter)
[![dependencies Status](https://david-dm.org/bollwar404/swagger-ajv-converter/status.svg)](https://david-dm.org/bollwar404/swagger-ajv-converter)
[![devDependencies Status](https://david-dm.org/bollwar404/swagger-ajv-converter/dev-status.svg)](https://david-dm.org/bollwar404/swagger-ajv-converter?type=dev)
[![Coverage Status](https://coveralls.io/repos/github/bollwar404/swagger-ajv-converter/badge.svg?branch=master)](https://coveralls.io/github/bollwar404/swagger-ajv-converter?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/bollwar404/swagger-ajv-converter/badge.svg)](https://snyk.io/test/github/bollwar404/swagger-ajv-converter)

Small module that converts from ajv schemas to Swagger doc

Api functions can throw following errors:

* `Error` for all problems

## Install

```bash
npm i -E swagger-ajv-converter
```

## Usage

```js
const Swagger = require('swagger-ajv-converter');

const myBaseSchema = require('./myBaseSchema.json');
const methodSchema = require('./methodSchema.json');

const name = 'My awesome module'; // module name
const swaggerData = {
  title: 'some title', // overall module title
  description: 'someDescr', // Description
}
const swaggerOptions = {
  type: 'API', //types from schema
  baseSchema: Object.assign({}, Swagger.base, myBaseSchema),
}

const swagger = new Swagger(name, swaggerData, swaggerOptions);

const methods = [
{
  path: '/one/',
  methods: {
    POST: {
      schema: methodSchema,
      swagger: {
        summary: 'Info',
        description: 'descr'
      }
    },
  },
}
]

```

## Example of AJV schema

```json
{
  "type": "object",
  "properties": {
    "body": {},
    "cookies": {},
    "query": {},
    "headers": {}
  }
}
```
