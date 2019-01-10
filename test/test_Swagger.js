'use strict';

const Swagger = require('../Swagger');
const sinon = require('sinon');
const {assert} = require('chai');

const testData = require('../files/test');
const baseData = require('../files/base');

describe('src/tw_shared_types/swagger/Swagger.js', () => {
	before(() => {
		this.sandbox = sinon.createSandbox();
	});
	beforeEach(() => {
		this.schema = {
			properties: {
				param: {
					type: 'string',
					examples: [
						'param'
					],
					title: 'title',
				}
			},
			required: ['param'],
			type: 'object',
		};
	});
	afterEach(() => {
		this.sandbox.restore();
	});
	describe('constructor', () => {
		it('Should just create object', () => {
			const swagger = new Swagger('name', {});
			assert.equal(swagger.servers.length, 1);
		});
		it('Should just throw error cause of non existing type', () => {
			let error;
			let result;
			try{
				result = new Swagger('name', {}, {type: 'some'});
			}
			catch(e){
				error = e;
			}
			assert.notEqual(error, null);
			assert.equal(result, null);
			assert.equal(error.message, 'WRONG_TYPE');
		});
	});
	describe('base getter', () => {
		it('should return base schema', () => {
			assert.deepEqual(Swagger.base, baseData)
		})
	});
	describe('createParam', () => {
		it('Should return object', () => {
			const result = Swagger.createParam('cookies', 'param', this.schema);
			assert.deepEqual(result, {
				in: 'cookie',
				name: 'param',
				description: 'title',
				required: true,
				schema: {
					type: 'string',
					example: 'param',
					pattern: undefined,
					description: 'title'
				}
			});
		});
	});
	describe('createJsonContent', () => {
		it('Should return object for JSON content', () => {
			const result = Swagger.createJsonContent('ref');
			assert.deepEqual(result, {
				'application/json': {
					schema: {
						$ref: 'ref',
					},
				},
			});
		});
	});
	describe('createProperty', () => {
		it('Should return property object', () => {
			const result = Swagger.createProperty(this.schema.properties.param, 'param');
			assert.deepEqual(result, { type: 'string', title: 'param', description: 'title' });
		});
	});
	describe('createPaths', () => {
		beforeEach(() => {
			this.addPath = this.sandbox.stub(Swagger.prototype, 'addPath').returns();
		});
		it('Should create paths for all methods', () => {
			const swagger = new Swagger('name', {});
			swagger.createPaths([{}, {}]);
			assert.equal(this.addPath.callCount, 2);
		});
	});
	describe('addPath', () => {
		beforeEach(() => {
			this.func = this.sandbox.stub().returns();
			this.makePath = this.sandbox.stub(Swagger.prototype, 'makePath').returns(this.func);
		});
		it('Should create one path', () => {
			const swagger = new Swagger('name', {});
			swagger.addPath({path: 'one', methods: {POST: 1}});
			assert.equal(this.makePath.callCount, 1);
			assert.equal(this.func.callCount, 1);
		});
	});
	describe('makePath', () => {
		beforeEach(() => {
			this.testData = {
				schema: testData,
				swagger: {
					summary: 'summary',
					description: 'description',
				}
			};
		});
		it('Should create one method for path', () => {
			const swagger = new Swagger('name', {});
			const func = swagger.makePath('one');
			assert.equal(typeof func, 'function');
			swagger.paths.one = {};
			func(['GET', this.testData]);
			assert.equal(Object.keys(swagger.paths).length, 1);
			assert.equal(Object.keys(swagger.components.schemas).length, 4);
			assert.equal(Object.keys(swagger.components.responses).length, 1);
		});
	});
	describe('createParamByType', () => {
		beforeEach(() => {
			this.createParamByType = this.sandbox.spy(Swagger.prototype, 'createParamByType');
			this.makeSchema = this.sandbox.spy(Swagger.prototype, 'makeSchema');
			this.createProperty = this.sandbox.spy(Swagger, 'createProperty');
		});
		it('Should create params', () => {
			const swagger = new Swagger('name', {});
			const func = swagger.createParamByType(testData.properties, 'path', 'type');
			assert.equal(typeof func, 'function');
			const result = func({}, 'cookies');
			assert.deepEqual(result, { cookies: { $ref: '#/components/schemas/path.type.cookies' } });
			assert.equal(this.createParamByType.callCount, 2);
			assert.equal(this.makeSchema.callCount, 1);
			assert.equal(this.createProperty.callCount, 2);
		});
	});
	describe('makeSchema', () => {
		beforeEach(() => {
			this.createParamByType = this.sandbox.spy(Swagger.prototype, 'createParamByType');
			this.makeSchema = this.sandbox.spy(Swagger.prototype, 'makeSchema');
			this.createProperty = this.sandbox.spy(Swagger, 'createProperty');
		});
		it('Should make schema for body', () => {
			const swagger = new Swagger('name', {});
			const result = swagger.makeSchema(testData, 'path', 'type');
			assert.equal(result, '#/components/schemas/path.type');
			assert.equal(this.createParamByType.callCount, 11);
			assert.equal(this.makeSchema.callCount, 8);
			assert.equal(this.createProperty.callCount, 14);
		});
	});
	describe('makeResponse', () => {
		beforeEach(() => {
			this.createResponse = this.sandbox.stub(Swagger.prototype, 'createResponse').returns('q');
		});
		it('Should start obj with responses', () => {
			const swagger = new Swagger('name', {});
			const func = swagger.makeResponse('path');
			const result = func({}, [1, 2]);
			assert.deepEqual(result, { 1: { $ref: 'q' } });
		});
	});
	describe('createResponse', () => {
		beforeEach(() => {
			this.makeSchema = this.sandbox.stub(Swagger.prototype, 'makeSchema').returns();
			this.addResponse = this.sandbox.stub(Swagger.prototype, 'addResponse').returns();
			this.createJsonContent = this.sandbox.stub(Swagger, 'createJsonContent').returns();
		});
		it('Should create one response', () => {
			const swagger = new Swagger('name', {});
			swagger.createResponse({}, 'path', 200);
			assert.equal(this.makeSchema.callCount, 1);
			assert.equal(this.addResponse.callCount, 1);
			assert.equal(this.createJsonContent.callCount, 1);
		});
	});
	describe('addSchema', () => {
		it('Should add schema to components', () => {
			const swagger = new Swagger('name', {});
			swagger.addSchema('path', {});
			assert.deepEqual(swagger.components.schemas.path, {});
		});
	});
	describe('addResponse', () => {
		it('Should add response to components', () => {
			const swagger = new Swagger('name', {});
			swagger.addResponse('path', {});
			assert.deepEqual(swagger.components.responses.path, {});
		});
	});
});
