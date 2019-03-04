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
 *           enum: [nude, mean, profile, other]
 *         capture:
 *           type: string
 *           format: binary
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
    return this.belongsTo('App/Models/User', 'reportee_id')
  }
}

module.exports = Report
