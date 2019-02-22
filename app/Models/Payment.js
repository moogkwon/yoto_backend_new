'use strict'

/** @type {typeof import('lucid-mongo/src/LucidMongo/Model')} */
const Model = use('Model')

/**
 * @swagger
 * components:
 *   schemas:
 *     NewPayment:
 *       type: object
 *       properties:
 *         device_id:
 *           type: string
 *         device_os:
 *           type: string
 *           enum: [ios, android]
 *         product_id:
 *           type: string
 *         transaction_receipt:
 *           type: string
 *         transaction_id:
 *           type: string
 *         transaction_date:
 *           type: string
 *     Payment:
 *       allOf:
 *         - $ref: '#/components/schemas/NewPayment'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             user_id:
 *               type: string
 */
class Payment extends Model {
  static boot () {
    super.boot()
  }

  static get dates () { return [...super.dates, 'transation_date'] }
  static get objectIDs () { return ['_id', 'user_id'] }

  user () {
    return this.belongsTo('App/Models/User')
  }
}

module.exports = Payment
