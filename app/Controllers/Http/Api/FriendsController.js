'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/auth/src/Schemes/Jwt')} AuthJwt */

const BaseController = require('./BaseController')
/** @type {typeof import('../../../Models/User')} */
// const User = use('App/Models/User')
// const Validator = use('Validator')
// const UnAuthorizeException = use('App/Exceptions/UnAuthorizeException')
// const Config = use('Config')

/**
 *
 * @class FriendsController
 */
class FriendsController extends BaseController {
  /**
   * Index
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, decodeQuery, auth }) {
    const users = await auth.user.friends().query(decodeQuery()).fetch()
    return response.apiCollection(users)
  }
}

module.exports = FriendsController
