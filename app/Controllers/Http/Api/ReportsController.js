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
    const reports = await Report.query(decodeQuery()).fetch()
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

    const report = new Report(request.only('reportee_id', 'reason'))
    report.user_id = auth.user._id

    request.multipart.file('file', validate, async (file) => {
      const fileName = `uploads/reports/${use('uuid').v1().replace(/-/g, '')}_${file.clientName}`
      await Drive.disk('s3').put(fileName, file.stream)

      report.file = fileName
      report.file_url = await Drive.disk('s3').getUrl(fileName)
      await report.save()
    })

    await request.multipart.process()
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
    await report.loadMany('user', 'reportee')
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
