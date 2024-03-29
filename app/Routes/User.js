'use strict'

/*
|--------------------------------------------------------------------------
| User Routers
|--------------------------------------------------------------------------
|
*/

const Route = use('Route')

Route.group('user', () => {
  /**
   * @swagger
   * /users:
   *   get:
   *     tags:
   *       - User
   *     summary: Get users
   *     parameters:
   *       - $ref: '#/components/parameters/ListQuery'
   *     responses:
   *       200:
   *         description: list user
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                   $ref: '#/components/schemas/User'
   */
  Route.get('/', 'Api/UsersController.index')
    .middleware(['auth:jwt', 'can:isAdmin'])

  /**
   * @swagger
   * /users/count:
   *   get:
   *     tags:
   *       - User
   *     summary: Get count user
   *     parameters:
   *       - $ref: '#/components/parameters/ListQuery'
   *     responses:
   *       200:
   *         description:  userCount
   */
  Route.get('/count', 'Api/UsersController.count')
    .middleware(['auth:jwt', 'can:isAdmin'])

  /**
   * \@swagger
   * /users:
   *   post:
   *     tags:
   *       - User
   *     summary: Create user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NewUser'
   *     responses:
   *       200:
   *         description: user
   *         schema:
   *           $ref: '#/components/schemas/User'
   */
  // Route.post('/', 'Api/UsersController.store')

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     tags:
   *       - User
   *     summary: Returns user
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *       - $ref: '#/components/parameters/SingleQuery'
   *     responses:
   *       200:
   *         description: user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  Route.get('/:id', 'Api/UsersController.show')
    .instance('App/Models/User')

  /**
   * @swagger
   * /users/{id}/token:
   *   post:
   *     tags:
   *       - User
   *     summary: Generate token for user
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *     responses:
   *       200:
   *         description: token
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  Route.post('/:id/token', 'Api/UsersController.token')
    .instance('App/Models/User')
    .middleware(['auth:jwt', 'can:isAdmin'])

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     tags:
   *       - User
   *     summary: Update users
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUser'
   *     responses:
   *       202:
   *         description: user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       422:
   *         $ref: '#/components/responses/ValidateFailed'
   */
  Route.put('/:id', 'Api/UsersController.update')
    .middleware(['auth:jwt'])
    .instance('App/Models/User')
    .validator('UpdateUser')

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     tags:
   *       - User
   *     summary: Delete user
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *     responses:
   *       202:
   *         description: delete success
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  Route.delete('/:id', 'Api/UsersController.destroy')
    .middleware(['auth:jwt', 'can:isAdmin'])
    .instance('App/Models/User')

  /**
   * @swagger
   * /users/{id}/block:
   *   put:
   *     tags:
   *       - User
   *     summary: Block user
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *     responses:
   *       202:
   *         description: block success
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  Route.put('/:id/block', 'Api/UsersController.block')
    .middleware(['auth:jwt', 'can:isAdmin'])
    .instance('App/Models/User')

  /**
   * @swagger
   * /users/{id}/unblock:
   *   put:
   *     tags:
   *       - User
   *     summary: Unblock user
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *     responses:
   *       202:
   *         description: unblock success
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  Route.put('/:id/unblock', 'Api/UsersController.unblock')
    .middleware(['auth:jwt', 'can:isAdmin'])
    .instance('App/Models/User')

  /**
   * @swagger
   * /users/{id}/reject:
   *   put:
   *     tags:
   *       - User
   *     summary: Reject user user profile video/photo
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *     responses:
   *       202:
   *         description: reject success
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  Route.put('/:id/reject', 'Api/UsersController.reject')
    .middleware(['auth:jwt', 'can:isAdmin'])
    .instance('App/Models/User')

  /**
   * @swagger
   * /users/upload-avatar:
   *   post:
   *     tags:
   *       - User
   *     summary: Upload avatar
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 required: true
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: upload success
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       422:
   *         $ref: '#/components/responses/ValidateFailed'
   */
  Route.post('/upload-avatar', 'Api/UsersController.uploadAvatar')
    .middleware(['auth:jwt'])

  /**
   * @swagger
   * /users/upload-profile-photo:
   *   post:
   *     tags:
   *       - User
   *     summary: Upload profile photo
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 required: true
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: upload success
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       422:
   *         $ref: '#/components/responses/ValidateFailed'
   */
  Route.post('/upload-profile-photo', 'Api/UsersController.uploadProfilePhoto')
    .middleware(['auth:jwt'])

  /**
   * @swagger
   * /users/upload-profile-video:
   *   post:
   *     tags:
   *       - User
   *     summary: Upload profile video
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 required: true
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: upload success
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       422:
   *         $ref: '#/components/responses/ValidateFailed'
   */
  Route.post('/upload-profile-video', 'Api/UsersController.uploadProfileVideo')
    .middleware(['auth:jwt'])
}).prefix('/api/v1/users')
