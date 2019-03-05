'use strict'

/*
|--------------------------------------------------------------------------
| Friend Routers
|--------------------------------------------------------------------------
|
*/

const Route = use('Route')

Route.group('friend', () => {
  /**
   * @swagger
   * /friends:
   *   get:
   *     tags:
   *       - Friend
   *     summary: Get friends
   *     parameters:
   *       - $ref: '#/components/parameters/ListQuery'
   *     responses:
   *       200:
   *         description: friends
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                   $ref: '#/components/schemas/User'
   */
  Route.get('/', 'Api/FriendsController.index')
    .middleware(['auth:jwt'])
}).prefix('/api/v1/friends')
