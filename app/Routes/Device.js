'use strict'

/*
|--------------------------------------------------------------------------
| Order Routers
|--------------------------------------------------------------------------
|
*/

const Route = use('Route')

Route.group('device', () => {
  /**
   * @swagger
   * /devices:
   *   post:
   *     tags:
   *       - Device
   *     summary: Register device token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               device_token:
   *                 type: string
   *                 required: true
   *               device_type:
   *                 type: string
   *                 required: true
   *     responses:
   *       200:
   *         description: item
   *         schema:
   *           $ref: '#/components/schemas/Device'
   */
  Route.post('/', 'Api/DevicesController.store')
    .middleware(['auth'])

  /**
   * @swagger
   * /devices/{device_id}:
   *   delete:
   *     tags:
   *       - Device
   *     summary: Register device token
   *     parameters:
   *       device_id:
   *         name: device_id
   *         description: device_id
   *         in:  path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: item
   *         schema:
   *           $ref: '#/components/schemas/Device'
   */
  Route.delete('/:device_id', 'Api/DevicesController.destroy')
    .middleware(['auth'])
}).prefix('/api/devices')
