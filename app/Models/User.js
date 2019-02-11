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
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
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
 *         name:
 *           type: string
 *     User:
 *       allOf:
 *         - $ref: '#/components/schemas/NewUser'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             avatar_url:
 *               type: string
 *             profile_photo_url:
 *               type: string
 *             video_photo_url:
 *               type: string
 *             profile_rejected:
 *               type: boolean
 *             is_blocked:
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
}

module.exports = User
