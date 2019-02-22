'use strict'

/*
|--------------------------------------------------------------------------
| Order Routers
|--------------------------------------------------------------------------
|
*/

const Route = use('Route')

Route.group('payment', () => {
  /**
   * @swagger
   * /payments:
   *   get:
   *     tags:
   *       - Payment
   *     summary: Get payments
   *     parameters:
   *       - $ref: '#/components/parameters/ListQuery'
   *     responses:
   *       200:
   *         description: payments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                   $ref: '#/components/schemas/Payment'
   */
  Route.get('/', 'Api/PaymentsController.index')
    .middleware(['auth:jwt', 'can:isAdmin'])

  /**
   * @swagger
   * /payments:
   *   post:
   *     tags:
   *       - Payment
   *     summary: Add payment result
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NewPayment'
   *     responses:
   *       200:
   *         description: item
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Payment'
   */
  Route.post('/', 'Api/PaymentsController.store')
    .middleware(['auth'])

  /**
   * @\swagger
   * /payments/{payment_id}:
   *   delete:
   *     tags:
   *       - Payment
   *     summary: Register payment token
   *     parameters:
   *       payment_id:
   *         name: payment_id
   *         description: payment_id
   *         in:  path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: item
   *         schema:
   *           $ref: '#/components/schemas/Payment'
   */
  // Route.delete('/:payment_id', 'Api/PaymentsController.destroy')
  //   .middleware(['auth'])
}).prefix('/api/v1/payments')
