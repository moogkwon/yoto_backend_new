'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
/** @typedef {import('@adonisjs/auth/src/Schemes/Jwt')} AuthJwt */

/** @typedef {import('./BaseController')} BaseController */
const BaseController = use('App/Controllers/Http/Api/BaseController')
/** @type {typeof import('../../../Models/Restaurant')} */
const Device = use('App/Models/Device')
// const Exceptions = use('Exceptions')
const ResourceNotFoundException = use('App/Exceptions/ResourceNotFoundException')

/**
 *
 * @class DevicesController
 */
class DevicesController extends BaseController {
  /**
   * Register
   *
   * @param {object} ctx
   * @param {AuthJwt} ctx.auth
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ auth, response, request }) {
    await this.validate(request.all(), {
      device_type: 'required|in:ios,android,web',
      device_id: 'required',
      token: 'required'
    })
    await Device.where({
      $or: [
        { user_id: auth.user._id },
        { device_id: request.input('device_id') }
      ]
    }).delete()
    const device = new Device(request.only(['token', 'device_type', 'device_id']))
    device.merge({
      user_id: auth.user._id,
      status: Device.STATUS_ENABLED
    })
    await device.save()
    return response.apiCreated(device)
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
    const device = await auth.user.devices().where({ device_id: params.device_id }).first()
    if (!device) {
      throw ResourceNotFoundException.invoke('Device not found')
    }
    device.status = Device.STATUS_DISABLED
    await device.save()
    return response.apiDeleted()
  }
}

module.exports = DevicesController
