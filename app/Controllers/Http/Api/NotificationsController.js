'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/auth/src/Schemes/Session')} AuthSession */

const BaseController = require('./BaseController')
/** @type {typeof import('../../../Models/Notification')} */
const Notification = use('App/Models/Notification')
/** @type {typeof import('../../../Models/User')} */
const User = use('App/Models/User')
// const Validator = use('Validator')
const UnAuthorizeException = use('App/Exceptions/UnAuthorizeException')
// const Config = use('Config')
const Drive = use('Drive')

/**
 *
 * @class NotificationsController
 */
class NotificationsController extends BaseController {
  /**
   * Index
   *
   * @param {object} ctx
   * @param {AuthSession} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, decodeQuery }) {
    const notifications = await Notification.query(decodeQuery()).fetch()
    return response.apiCollection(notifications)
  }

  /**
   * Store
   *
   * @param {object} ctx
   * @param {AuthSession} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, auth }) {
    await this.validate(request.all(), {
      title: 'required',
      content: 'required'
    })

    const notification = new Notification(request.only([
      'title',
      'content'
    ]))
    notification.user_id = auth.user._id
    await notification.save()
    
    return response.apiCreated(notification)
  }

  /**
   * Show
   *
   * @param {object} ctx
   * @param {AuthSession} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ request, response, instance, decodeQuery }) {
    const notification = instance
    await notification.loadMany('user', 'notificationee')
    return response.apiItem(notification)
  }

  /**
   * Destroy
   *
   * @param {object} ctx
   * @param {AuthSession} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ request, response, instance, auth }) {
    const notification = instance
    await notification.delete()
    return response.apiDeleted()
  }
}

module.exports = NotificationsController
