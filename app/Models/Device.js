'use strict'

/** @type {typeof import('lucid-mongo/src/LucidMongo/Model')} */
const Model = use('Model')

/**
 * @swagger
 * components:
 *   schemas:
 *     NewDevice:
 *       type: object
 *       properties:
 *         device_id:
 *           type: string
 *         device_type:
 *           type: string
 *         token:
 *           type: string
 *     Device:
 *       allOf:
 *         - $ref: '#/components/schemas/NewDevice'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             user_id:
 *               type: string
 *             status:
 *               type: string
 *               enum: ['enabled', 'disabled']
 */
class Device extends Model {
  static boot () {
    super.boot()
  }

  user () {
    return this.belongsTo('App/Models/User')
  }
}

module.exports = Device
