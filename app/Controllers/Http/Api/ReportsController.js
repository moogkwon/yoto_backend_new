'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/auth/src/Schemes/Session')} AuthSession */

const BaseController = require('./BaseController')
/** @type {typeof import('../../../Models/Report')} */
const Report = use('App/Models/Report')
/** @type {typeof import('../../../Models/User')} */
const User = use('App/Models/User')
// const Validator = use('Validator')
const UnAuthorizeException = use('App/Exceptions/UnAuthorizeException')
const ValidateErrorException = use('App/Exceptions/ValidateErrorException')
// const Config = use('Config')
const Drive = use('Drive')

/**
 *
 * @class ReportsController
 */
class ReportsController extends BaseController {
  /**
   * Index
   *
   * @param {object} ctx
   * @param {AuthSession} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, decodeQuery }) {
    const query = decodeQuery()
    const q = Report.query(query)
    if (query.search) {
      q.where({
        $or: [
          { reportee_name: { $regex: new RegExp(`.*${query.search}.*`, 'i') } },
          { reporter_name: { $regex: new RegExp(`.*${query.search}.*`, 'i') } }
        ]
      })
    }
    const reports = await q.fetch()
    return response.apiCollection(reports)
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
      requestee_id: 'required|objectId',
      reason: 'required'
    })
    const validate = {
      size: '200kb',
      types: ['image']
    }

    const otherUser = await User.find(request.input('requestee_id'))
    if (!otherUser) {
      throw ValidateErrorException.invoke([{ field: 'requestee_id', message: 'User not found' }])
    }

    const report = new Report({
      user_id: auth.user._id,
      user_name: auth.user.name,
      requestee_id: otherUser.user._id,
      reportee_name: otherUser.name
    })

    request.multipart.file('file', validate, async (file) => {
      const fileName = `uploads/reports/${use('uuid').v1().replace(/-/g, '')}_${file.clientName}`
      await Drive.disk('s3').put(fileName, file.stream)

      report.file = fileName
      report.file_url = await Drive.disk('s3').getUrl(fileName)
      await report.save()
    })

    await request.multipart.process()

    auth.user.report_count = (auth.user.report_count || 0) + 1
    await auth.user.save()
    otherUser.reported_count = (otherUser.reported_count || 0) + 1
    await otherUser.save()

    return response.apiCreated(report)
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
    const report = instance
    await report.loadMany(['user', 'reportee'])
    return response.apiItem(report)
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
    const report = instance
    await report.delete()
    return response.apiDeleted()
  }
}

module.exports = ReportsController
