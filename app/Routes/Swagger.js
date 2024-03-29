'use strict'
/** @type {import('@adonisjs/framework/src/Route/Manager'} */
const Route = use('Route')
const swaggerJSDoc = use('swagger-jsdoc')
/**
 * Swagger jsDoc
 */
Route.get('api-specs', async ({ request, response }) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'YOTO REST API', // Title (required)
        version: '1.0' // Version (required)
      },
      servers: [
        { url: `/api/v1` }
      ],
      // host: `${Config.get('host')}:${Config.get('port')}`,
      // basePath: '/api/v1',
      security: [
        { bearerAuth: [] }
      ],
      schemes: [
        'http',
        'https'
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    apis: [
      './app/Routes/*.js',
      './app/Models/*.js'
    ] // Path to the API docs
  }
  // Initialize swagger-jsdoc -> returns validated swagger spec in json format
  return swaggerJSDoc(options)
}).as('swaggerSpec')

/**
 * Swagger UI
 */
Route.get('docs', ({ view }) => {
  return view.render('swagger')
}).as('swaggerUI')

/**
 * @swagger
 * components:
 *   parameters:
 *     Id:
 *       name: id
 *       description: id of instance
 *       in:  path
 *       required: true
 *       schema:
 *         type: string
 *     ListQuery:
 *       name: query
 *       description: '{ "where": { },  "with": ["string"], "select": ["string"], "limit": 20, "skip": 0, "sort": "string" }'
 *       in:  query
 *       required: false
 *       schema:
 *         type: string
 *     SingleQuery:
 *       name: query
 *       description: '{ "with": ["string"], "select": ["string"] }'
 *       in:  query
 *       required: false
 *       schema:
 *         type: string
 *
 *   responses:
 *     Unauthorized:
 *       description: JWT token invalid or did not provided
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: number
 *                 default: 401
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 *     ValidateFailed:
 *       description: Validation failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: number
 *                 default: 422
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: number
 *                 default: 404
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 *     Forbidden:
 *       description: Access denied
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: number
 *                 default: 403
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 */
