'use strict'

/** @type {typeof import('lucid-mongo/src/LucidMongo/Model')} */
const Model = use('Model')

/**
 * @swagger
 * components:
 *   schemas:
 *     NewNotification:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         birth_year_min:
 *           type: number
 *           min: 1990
 *         birth_year_max:
 *           type: number
 *           min: 1990
 *         gender:
 *           type: string
 *           enum: ['male', 'female']
 *         lgbtq:
 *           type: boolean
 *         location_country:
 *           type: string
 *         location_country_code:
 *           type: string
 *         location_state:
 *           type: string
 *         location_city:
 *           type: string
 *         send_time:
 *           type: string
 *           format: date-time
 *     Notification:
 *       allOf:
 *         - $ref: '#/components/schemas/NewNotification'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             status:
 *               type: string
 *               enum: ['waiting', 'sent']
 */

class Notification extends Model {
  static boot () {
    super.boot()
  }

  static get ndates () {
    return [...super.dates, 'send_time']
  }

  users () {
    return this.belongsToMany('App/Models/User')
  }
}

module.exports = Notification
