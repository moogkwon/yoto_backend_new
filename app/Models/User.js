'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

/** @type {typeof import('lucid-mongo/src/LucidMongo/Model')} */
const Model = use('Model')

/**
 * @swagger
 * components:
 *   schemas:
 *     NewUser:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *     UpdateUser:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         instagram:
 *           type: string
 *         birth_year:
 *           type: number
 *           min: 1990
 *         gender:
 *           type: string
 *           enum: ['male', 'female']
 *         lgbtq:
 *           type: boolean
 *         location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *         location_country:
 *           type: string
 *         location_country_code:
 *           type: string
 *         location_state:
 *           type: string
 *         location_city:
 *           type: string
 *     User:
 *       allOf:
 *         - $ref: '#/components/schemas/NewUser'
 *         - $ref: '#/components/schemas/UpdateUser'
 *         - type: object
 *           properties:
 *             name:
 *               type: string
 *             _id:
 *               type: string
 *             avatar_url:
 *               type: string
 *             profile_photo_url:
 *               type: string
 *             profile_video_url:
 *               type: string
 *             social_id:
 *               type: string
 *             social:
 *               type: string
 *             profile_rejected:
 *               type: boolean
 *             is_blocked:
 *               type: boolean
 *             is_online:
 *               type: boolean
 */

class User extends Model {
  static boot () {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
      if (userInstance.dirty.first_name || userInstance.dirty.last_name) {
        userInstance.name = `${userInstance.dirty.first_name} ${userInstance.dirty.last_name}`
      }
    })
  }

  static get hidden () { return ['password'] }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens () {
    return this.hasMany('App/Models/Token')
  }

  images () {
    return this.morphMany('App/Models/Image', 'imageable_type', 'imageable_id')
  }

  conversations () {
    return this.hasMany('App/Models/Conversation', '_id', 'user_ids')
  }

  friends () {
    return this.referMany('App/Models/User', '_id', 'friend_ids')
  }

  reports () {
    return this.hasMany('App/Models/Report')
  }

  reporteds () {
    return this.hasMany('App/Models/Report', '_id', 'reportee_id')
  }

  devices () {
    return this.hasMany('App/Models/Device')
  }

  payments () {
    return this.hasMany('App/Models/Payment')
  }
}

module.exports = User
