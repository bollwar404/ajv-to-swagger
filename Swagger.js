

const clone = require('stringify-clone');

const baseSwagger = require('./files/base');

const places = {
  params: 'path',
  query: 'query',
  cookies: 'cookie',
};

const defaultOptions = {
  type: 'default',
  baseSchema: baseSwagger,
};

class Swagger {
  /**
   * Constructor
   * @param moduleName
   * @param data
   * @param [options]
   */
  constructor(moduleName, data, options = {}) {
    const { type, baseSchema } = Object.assign({}, defaultOptions, options);
    Object.assign(this, clone(baseSchema));
    if (!this.servers[type]) {
      throw new Error('WRONG_TYPE');
    }
    this.servers = [this.servers[type]];
    this.servers[0].url += moduleName;
    this.info.title = data.title;
    this.info.description = data.description;
  }

  /**
   * Getter for base swagger object
   */
  static get base() {
    return clone(baseSwagger);
  }

  /**
   * Returns request param
   * @param type
   * @param param
   * @param curSchema
   * @return {{
   * in: *,
   * name: *,
   * description: *,
   * required: (*|boolean|undefined),
   * schema: {
   *   type: (*|string),
   *   example: *,
   *   pattern: *,
   *   description: *
   *   }
   * }}
   * @private
   */
  static createParam(type, param, curSchema) {
    return {
      in: places[type],
      name: param,
      description: curSchema.properties[param].title,
      required: (curSchema.required && curSchema.required.includes(param)) || undefined,
      schema: {
        type: curSchema.properties[param].type.toLowerCase(),
        example: curSchema.properties[param].examples && curSchema.properties[param].examples[0],
        pattern: curSchema.properties[param].pattern,
        description: curSchema.properties[param].title,
      },
    };
  }

  /**
   * Mares JSON content dir
   * @param $ref
   * @return {{'application/json': {schema: {$ref: *}}}}
   * @private
   */
  static createJsonContent($ref) {
    return {
      'application/json': {
        schema: {
          $ref,
        },
      },
    };
  }

  /**
   * Creates simple property
   * @param schema
   * @param param
   * @return {{type: *, title: string, description: *}}
   * @private
   */
  static createProperty(schema, param) {
    return {
      type: schema.type,
      title: String(param),
      description: schema.title,
    };
  }

  /**
   * Creates json paths with responses
   * @param {Object[]} methods
   * @param {String} methods.name
   * @param {String} methods.path
   * @param {Object} methods.methods
   * @param {Object} [methods.methods.POST]
   * @param {Object} [methods.methods.PUT]
   * @param {Object} [methods.methods.GET]
   * @param {Object} [methods.methods.DELETE]
   */
  createPaths(methods) {
    const ctx = this;
    methods.forEach((method) => {
      ctx.addPath(method);
    });
  }

  /**
   * Makes one path
   * @param {Object} method
   * @param {String} method.name
   * @param {String} method.path
   * @param {Object} method.methods
   * @param {Object} [method.methods.POST]
   * @param {Object} [method.methods.PUT]
   * @param {Object} [method.methods.GET]
   * @param {Object} [method.methods.DELETE]
   * @private
   */
  addPath(method) {
    this.paths[method.path] = {};
    const ctx = this;
    Object.entries(method.methods).forEach(ctx.makePath(method.path));
  }

  /**
   * Makes one path
   * @param path
   * @return {Function}
   * @private
   */
  makePath(path) {
    const ctx = this;
    return ([method, data]) => {
      this.paths[path][method.toLowerCase()] = {};
      const current = this.paths[path][method.toLowerCase()];
      const name = `${path.replace(/\W/g, '')}.${method.toLowerCase()}`;
      const { schema } = data;
      current.summary = data.swagger && data.swagger.summary;
      current.description = data.swagger && data.swagger.description;
      current.parameters = [];
      if (schema.properties.body) {
        current.requestBody = {
          required: schema.required.includes('body') || undefined,
          content: Swagger.createJsonContent(ctx.makeSchema(schema.properties.body, name, 'body')),
        };
      }
      (['params', 'query', 'cookies', 'header']).forEach((type) => {
        const curSchema = schema.properties[type];
        if (!curSchema) {
          return;
        }
        Object.keys(curSchema.properties).forEach((param) => {
          if (curSchema.properties[param].type.toLowerCase() === 'object') {
            return;
          }
          current.parameters.push(Swagger.createParam(type, param, curSchema));
        });
      });
      if (data.swagger && data.swagger.responses) {
        current.responses = Object.entries(data.swagger.responses)
          .reduce(ctx.makeResponse(name), {});
      } else {
        current.responses = {
          200: {
            $ref: '#/components/responses/default200',
          },
        };
      }
    };
  }

  /**
   * Creates param by type
   * @param properties
   * @param path
   * @param type
   * @return {function(*, *=): *}
   * @private
   */
  createParamByType(properties, path, type) {
    return (acc, param) => {
      const currentSchema = acc;
      const property = properties[param];
      const curType = (property.type && property.type.toLowerCase()) || (property.oneOf && 'oneOf') || 'some';
      switch (curType) {
        case 'object':
          currentSchema[param] = {
            $ref: this.makeSchema(property, path, `${type}.${param}`),
          };
          break;
        case 'array':
          currentSchema[param] = {
            type: 'array',
            items: (['items']).reduce(this.createParamByType(property, path, `${type}.array`), {}),
          };
          break;
        case 'oneOf':
          currentSchema[param] = {
            oneOf: property.oneOf
              .map((data, index) => index)
              .reduce(this.createParamByType(property.oneOf, path, `${type}.oneOf`), []),
          };
          break;
        default:
          currentSchema[param] = Swagger.createProperty(property, param);
          break;
      }
      return currentSchema;
    };
  }

  /**
   * Makes schema
   * @param schema
   * @param path
   * @param type
   * @return {string}
   * @private
   */
  makeSchema(schema, path, type) {
    const ctx = this;
    const name = `${path}.${type}`;
    const currentSchema = {
      type: 'object',
      required: schema.required && schema.required.length && schema.required,
    };
    currentSchema.properties = Object.keys(schema.properties)
      .reduce(ctx.createParamByType(schema.properties, path, type), {});
    this.addSchema(name, currentSchema);
    return `#/components/schemas/${name}`;
  }

  /**
   * Makes response
   * @param path
   * @return {function(*, *[]): *}
   * @private
   */
  makeResponse(path) {
    const ctx = this;
    return (acc, [status, response]) => {
      acc[status] = {
        $ref: ctx.createResponse(response, path, status),
      };
      return acc;
    };
  }

  /**
   * Creates response object
   * @param response
   * @param path
   * @param status
   * @return {string}
   * @private
   */
  createResponse(response, path, status) {
    const name = `${path}.${status}`;
    const resp = {
      description: response.description,
      content: Swagger.createJsonContent(this.makeSchema(response.schema, name, 'response')),
    };
    this.addResponse(name, resp);
    return `#/components/responses/${name}`;
  }

  /**
   * Add schema to swaggers components
   * @param name
   * @param schema
   * @private
   */
  addSchema(name, schema) {
    this.components.schemas[name] = schema;
  }

  /**
   * Add response to swaggers components
   * @param name
   * @param data
   * @private
   */
  addResponse(name, data) {
    this.components.responses[name] = data;
  }
}

module.exports = Swagger;
