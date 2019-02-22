'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/auth/src/Schemes/Jwt')} AuthJwt */

/** @typedef {import('./BaseController')} BaseController */
const BaseController = use('App/Controllers/Http/Api/BaseController')
/** @type {typeof import('../../../Models/Restaurant')} */
const Payment = use('App/Models/Payment')
// const Exceptions = use('Exceptions')
const ResourceNotFoundException = use('App/Exceptions/ResourceNotFoundException')

/**
 *
 * @class PaymentsController
 */
class PaymentsController extends BaseController {
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
    const q = Payment.query(query)
    if (query.search) {
      q.where({
        user_name: { $regex: new RegExp(`.*${query.search}.*`, 'i') }
      })
    }
    const payments = await q.paginate(query.page, query.perPage)
    return response.json(payments)
  }

  /**
   * Add payment
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ auth, response, request }) {
    await this.validate(request.all(), {
      device_id: 'required',
      device_os: 'required|in:ios,android',
      product_id: 'required',
      subscription_duration: 'required',
      transaction_receipt: 'required',
      transaction_id: 'required',
      transaction_date: 'required'
    })
    const payment = new Payment(request.only([
      'device_id',
      'device_os',
      'product_id',
      'subscription_duration',
      'transaction_receipt',
      'transaction_id',
      'transaction_date'
    ]))
    payment.merge({
      user_id: auth.user._id,
      user_name: auth.user.name
    })
    await payment.save()
    return response.apiCreated(payment)
  }

  /**
   * Remove
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ auth, response, params }) {
    const payment = await auth.user.payments().where({ payment_id: params.payment_id }).first()
    if (!payment) {
      throw ResourceNotFoundException.invoke('Payment not found')
    }
    payment.status = Payment.STATUS_DISABLED
    await payment.save()
    return response.apiDeleted()
  }
}

module.exports = PaymentsController
