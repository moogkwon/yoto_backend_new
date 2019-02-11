'use strict'

/** @type {typeof import('lucid-mongo/src/LucidMongo/Model')} */
const Model = use('Model')

/**
 * @swagger
 * components:
 *   schemas:
 *     NewReport:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *         reportee_id:
 *           type: string
 *         reason:
 *           type: string
 *         capture:
 *           type: string
 *     Report:
 *       allOf:
 *         - $ref: '#/components/schemas/NewReport'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 */

class Report extends Model {
  static boot () {
    super.boot()
  }

  user () {
    return this.belongsTo('App/Models/User')
  }

  reportee () {
    return this.belongsTo('App/Models/User', '_id', 'reportee_id')
  }
}

module.exports = Report
