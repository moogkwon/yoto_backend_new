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
   *             $ref: '#/components/schemas/NewDevice'
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
}).prefix('/api/v1/devices')
