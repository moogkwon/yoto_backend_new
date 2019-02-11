'use strict'

/*
|--------------------------------------------------------------------------
| Notification Routers
|--------------------------------------------------------------------------
|
*/

const Route = use('Route')

Route.group('notification', () => {
  /**
   * @swagger
   * /notifications:
   *   get:
   *     tags:
   *       - Notification
   *     summary: Get notifications
   *     parameters:
   *       - $ref: '#/components/parameters/ListQuery'
   *     responses:
   *       200:
   *         description: notifications
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                   $ref: '#/components/schemas/Notification'
   */
  Route.get('/', 'Api/NotificationsController.index')
    .middleware(['auth:jwt', 'can:isAdmin'])

  /**
   * @swagger
   * /notifications:
   *   post:
   *     tags:
   *       - Notification
   *     summary: Create notification
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
   *               requestee_id:
   *                 required: true
   *                 type: string
   *               reason:
   *                 required: true
   *                 type: string
   *     responses:
   *       200:
   *         description: notification
   *         schema:
   *           $ref: '#/components/schemas/Notification'
   */
  Route.post('/', 'Api/NotificationsController.store')
    .middleware(['auth:jwt'])

  /**
   * @swagger
   * /notifications/{id}:
   *   get:
   *     tags:
   *       - Notification
   *     summary: Returns notification
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *       - $ref: '#/components/parameters/SingleQuery'
   *     responses:
   *       200:
   *         description: notification
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Notification'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  Route.get('/:id', 'Api/NotificationsController.show')
    .instance('App/Models/Notification')

  /**
   * @swagger
   * /notifications/{id}:
   *   delete:
   *     tags:
   *       - Notification
   *     summary: Delete notification
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
  Route.delete('/:id', 'Api/NotificationsController.destroy')
    .middleware(['auth:jwt', 'can:isAdmin'])
    .instance('App/Models/Notification')
}).prefix('/api/v1/notifications')
