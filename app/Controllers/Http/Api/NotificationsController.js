'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/auth/src/Schemes/Jwt')} AuthJwt */

const BaseController = require('./BaseController')
/** @type {typeof import('../../../Models/Notification')} */
const Notification = use('App/Models/Notification')
/** @type {typeof import('../../../Models/User')} */
const User = use('App/Models/User')
// const Validator = use('Validator')
const UnAuthorizeException = use('App/Exceptions/UnAuthorizeException')
// const Config = use('Config')
const Drive = use('Drive')
const moment = require('moment')

/**
 *
 * @class NotificationsController
 */
class NotificationsController extends BaseController {
  /**
   * Index
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, decodeQuery }) {
    const query = decodeQuery()
    const q = Notification.query(query)
    if (query.search) {
      q.where({
        $or: [
          { title: { $regex: new RegExp(`.*${query.search}.*`, 'i') } },
          { content: { $regex: new RegExp(`.*${query.search}.*`, 'i') } }
        ]
      })
    }
    const notifications = await q.paginate(query.page, query.perPage)
    return response.json(notifications)
  }

  /**
   * Store
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, auth }) {
    await this.validate(request.all(), {
      title: 'required',
      content: 'required',
      send_time: 'date'
    })

    const notification = new Notification(request.only([
      'title',
      'content',
      'send_time',
      'activity',
      'country',
      'gender',
      'lgbtq',
      'birth_year_min',
      'birth_year_max',
      'user_ids'
    ]))
    notification.user_id = auth.user._id
    notification.status = 'waiting'
    notification.send_time = request.input('send_time') || moment()
    await notification.save()

    return response.apiCreated(notification)
  }

  /**
   * Show
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
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
   * @param {AuthJwt} ctx.auth
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
