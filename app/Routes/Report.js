'use strict'

/*
|--------------------------------------------------------------------------
| Report Routers
|--------------------------------------------------------------------------
|
*/

const Route = use('Route')

Route.group('report', () => {
  /**
   * @swagger
   * /reports:
   *   get:
   *     tags:
   *       - Report
   *     summary: Get reports
   *     parameters:
   *       - $ref: '#/components/parameters/ListQuery'
   *     responses:
   *       200:
   *         description: reports
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                   $ref: '#/components/schemas/Report'
   */
  Route.get('/', 'Api/ReportsController.index')
    .middleware(['auth:jwt', 'can:isAdmin'])

  /**
   * @swagger
   * /reports:
   *   post:
   *     tags:
   *       - Report
   *     summary: Create report
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
   *         description: report
   *         schema:
   *           $ref: '#/components/schemas/Report'
   */
  Route.post('/', 'Api/ReportsController.store')
    .middleware(['auth:jwt'])

  /**
   * @swagger
   * /reports/{id}:
   *   get:
   *     tags:
   *       - Report
   *     summary: Returns report
   *     parameters:
   *       - $ref: '#/components/parameters/Id'
   *       - $ref: '#/components/parameters/SingleQuery'
   *     responses:
   *       200:
   *         description: report
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Report'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  Route.get('/:id', 'Api/ReportsController.show')
    .instance('App/Models/Report')

  /**
   * @swagger
   * /reports/{id}:
   *   delete:
   *     tags:
   *       - Report
   *     summary: Delete report
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
  Route.delete('/:id', 'Api/ReportsController.destroy')
    .middleware(['auth:jwt', 'can:isAdmin'])
    .instance('App/Models/Report')
}).prefix('/api/v1/reports')
