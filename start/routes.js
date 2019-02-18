'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/guides/routing
|
*/
/** @type {import('@adonisjs/framework/src/Route/Manager'} */
const Route = use('Route')
const Helpers = use('Helpers')
const readFile = Helpers.promisify(require('fs').readFile)

// Route.get('/', ({ request }) => {
//   return { greeting: 'Hello world in JSON' }
// })

use('require-all')(`${use('Helpers').appRoot()}/app/Routes`)

Route.any('*', async ({ response }) => {
  try {
    const bundle = Helpers.publicPath('index.html')
    const html = await readFile(bundle, 'utf8')
    response.safeHeader('Cache-Control', 'no-cache').send(html)
  } catch (error) {
    return 'Put react bundle to public directory'
  }
})
