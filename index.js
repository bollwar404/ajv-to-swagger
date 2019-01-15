'use strict';

const Ajv = require('ajv');
const toOpenApi = require('json-schema-to-openapi-schema');
const OpenAPISchemaValidator = require('openapi-schema-validator').default;
const debug = require('debug')('ajvToSwagger');

const ajv = new Ajv({ verbose: true, allErrors: true });
const swaggerBase = require('./files/swaggerDraft.json');

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isPrimitive(test) {
  return (test !== Object(test));
}

function fixPatternProperties(obj) {
  const defaultValue = obj instanceof Array && [] || {};
  return Object.entries(obj).reduce((res, [name, value]) => {
    if (name === 'additionalProperties') {
      if (!res.additionalProperties) {
        res.additionalProperties = value;
      }
      return res;
    }
    if (name === 'patternProperties') {
      res.additionalProperties = fixPatternProperties(Object.values(value)[0]);
      // eslint-disable-next-line prefer-destructuring
      res['x-pattern'] = Object.keys(value)[0];
      return res;
    }
    if (isPrimitive(value)) {
      res[name] = value;
      return res;
    }
    res[name] = fixPatternProperties(value);
    return res;
  }, defaultValue);
}

function convertSchema(schema, options = { validate: true }) {
  debug('compiling schema via ajv');
  try {
    ajv.compile(schema);
  } catch (err) {
    debug('AJV validation failed, chema is invalid');
    throw err;
  }
  debug('schema is valid');
  debug('converting patternProperties');
  const propertiesConverted = fixPatternProperties(schema);
  const convertedSchema = toOpenApi(Object.assign({}, propertiesConverted, { $schema: 'http://json-schema.org/draft-07/schema#' }));
  if (!options.validate) {
    return convertedSchema;
  }
  const validator = new OpenAPISchemaValidator({
    // optional
    version: 3,
    // optional
    version2Extensions: {
      /* place any properties here to extend the schema. */
    },
    // optional
    version3Extensions: {
      /* place any properties here to extend the schema. */
    },
  });

  const swaggerDoc = clone(swaggerBase);
  swaggerDoc.paths['/get/some/'].get.responses['200'].content['application/json'].schema = convertedSchema.schema;
  const errors = validator.validate(swaggerDoc);
  if (errors && errors.length) {
    debug('There were errors while validating converted schema as open api:');
    debug(JSON.stringify(errors, null, 3));
    throw new Error(JSON.stringify(errors));
  }
  debug('validation of coverted schema okay!');
  return convertedSchema;
}

module.exports = {
  convertSchema,
};
