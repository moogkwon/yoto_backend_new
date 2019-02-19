'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

/** @type {typeof import('lucid-mongo/src/LucidMongo/Model')} */
const Model = use('Model')

/**
 * @swagger
 * components:
 *   schemas:
 *     NewConversation:
 *       type: object
 *       properties:
 *         user_ids:
 *           type: array
 *     Conversation:
 *       allOf:
 *         - $ref: '#/components/schemas/NewConversation'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             start_at:
 *               type: string
 *               format: date
 *             end_at:
 *               type: string
 *               format: date
 *             status:
 *               type: string
 *               enum: [waiting, calling, ended]
 *             duration:
 *               type: number
 */

class Conversation extends Model {
  static boot () {
    super.boot()
  }

  static get objectIDs () { return ['_id', 'user_id', 'user_ids'] }

  static get dates () { return [...super.dates, 'start_at', 'end_at'] }

  users () {
    return this.referMany('App/Models/User')
  }
}

module.exports = Conversation
